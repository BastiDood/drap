import { NonRetriableError } from 'inngest';

import { assertSingle } from '$lib/server/assert';
import {
  createBatchEvent,
  createEmailMessage,
  getEmailThreadKey,
  isRetryableGmailStatus,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailSeedFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { lockOrCreateEmailThreads, seedEmailThread } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.seed-fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const sendSeedEmailFallback = inngest.createFunction(
  {
    id: 'send-seed-email-fallback',
    name: 'Send Seed Email Fallback',
    triggers: EmailSeedFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');
    const followupEvents = await step.run(
      { id: 'send-seed-email-fallback', name: 'Send Seed Email Fallback' },
      async () =>
        await tracer.asyncSpan('send-seed-email-fallback', async () => {
          const { seed, followers } = event.data;
          const key = getEmailThreadKey(seed);
          const { client, sender } = await getRefreshedCredentials();

          return await db.transaction(
            async tx => {
              const row = assertSingle(await lockOrCreateEmailThreads(tx, [key]));

              if (row.gmailThreadId !== null)
                return [seed, ...followers].map(envelope => createBatchEvent(envelope));

              const { message } = await createEmailMessage(seed, sender);
              try {
                const result = await client.sendEmail(message);
                logger.info('gmail root seed fallback email sent successfully', {
                  'email.attempt': event.data.attempt ?? 0,
                  'email.message.id': result.id,
                  'email.message.thread_id': result.threadId,
                  'email.message.internal_date': result.internalDate,
                  'email.message.label_ids': result.labelIds,
                });
                await seedEmailThread(tx, key, result.threadId, [seed.data.gmailMessageId]);
                return followers.map(envelope => createBatchEvent(envelope));
              } catch (cause) {
                if (cause instanceof GmailScopeError)
                  throw new NonRetriableError('missing gmail scopes', { cause });
                if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
                  throw new NonRetriableError(
                    'gmail seed fallback failed with non-retryable status',
                    { cause },
                  );
                throw cause;
              }
            },
            { isolationLevel: 'read committed' },
          );
        }),
    );

    if (followupEvents.length > 0)
      await step.sendEvent('dispatch-seed-fallback-followups', followupEvents);
    return followupEvents.length;
  },
);
