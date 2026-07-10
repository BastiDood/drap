import { NonRetriableError } from 'inngest';

import { assertSingle } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  getGmailThreadKeyString,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchEvent, EmailSeedFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import {
  getRefreshedCredentials,
  type RefreshedCredentials,
} from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { lockGmailThreads, seedGmailThreadById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.seed-fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const sendSeedEmailFallback = inngest.createFunction(
  {
    id: 'send-seed-email-fallback',
    name: 'Send Seed Email Fallback',
    concurrency: {
      limit: 1,
      scope: 'env',
      key: '"gmail-designated-sender"',
    },
    throttle: {
      limit: 2,
      period: '1m',
      burst: 1,
    },
    retries: 0,
    triggers: EmailSeedFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const followups = await step.run(
      { id: 'seed-fallback-email-thread', name: 'Seed Fallback Email Thread' },
      async () => {
        const credentials = await getRefreshedCredentials();
        return await seedFallbackEmailThread(event.data, credentials);
      },
    );

    if (followups.length > 0)
      await step.sendEvent(
        'dispatch-seed-fallback-followups',
        followups.map(data => EmailBatchEvent.create(data)),
      );
    return followups.length;
  },
);

async function seedFallbackEmailThread(
  event: EmailSeedFallbackEvent,
  credentials: RefreshedCredentials,
) {
  return await tracer.asyncSpan('seed-fallback-email-thread', async span => {
    const key = getGmailThreadKey(event.seed);
    span.setAttributes({
      'email.seed.follower.count': event.followers.length,
      'email.gmail_thread.logical_key': getGmailThreadKeyString(key),
    });

    return await db.transaction(
      async tx => {
        const row = assertSingle(await lockGmailThreads(tx, [key]));
        if (row.gmailThreadId !== null)
          return [event.seed, ...event.followers].map(email => ({
            email,
            batchAttempt: 0,
          }));

        try {
          const { message } = await createEmailMessage(event.seed, credentials.sender);
          const result = await credentials.client.sendEmail(message);
          logger.info('gmail root seed fallback email sent successfully', {
            'email.message.id': result.id,
            'email.message.thread_id': result.threadId,
          });
          // Keep Gmail metadata lookup in this transaction so seeded threads only become visible
          // after their Gmail thread ID and first `Message-ID` header can be persisted together.
          const gmailMessageId = await credentials.client.getMessageIdHeader(result.id);
          await seedGmailThreadById(tx, row.id, result.threadId, [gmailMessageId]);
        } catch (cause) {
          if (cause instanceof GmailScopeError)
            throw new NonRetriableError('missing gmail scopes', { cause });
          if (cause instanceof GmailError)
            throw new NonRetriableError('gmail seed email exhausted delivery attempts', {
              cause,
            });
          throw cause;
        }

        return event.followers.map(email => ({ email, batchAttempt: 0 }));
      },
      { isolationLevel: 'read committed' },
    );
  });
}
