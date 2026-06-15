import assert from 'node:assert/strict';

import { NonRetriableError } from 'inngest';

import { appendGmailThreadMessageIds, lockGmailThreads } from '$lib/server/database/drizzle';
import { assertSingle } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  isRetryableGmailStatus,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.batch-fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const sendBatchEmailFallback = inngest.createFunction(
  {
    id: 'send-batch-email-fallback',
    name: 'Send Batch Email Fallback',
    triggers: EmailBatchFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    await step.run(
      { id: 'send-batch-email-fallback', name: 'Send Batch Email Fallback' },
      async () =>
        await tracer.asyncSpan('send-batch-email-fallback', async () => {
          const { email } = event.data;
          const key = getGmailThreadKey(email);
          const { client, sender } = await getRefreshedCredentials();

          return await db.transaction(
            async tx => {
              const row = assertSingle(await lockGmailThreads(tx, [key]));
              assert(row.gmailThreadId !== null, 'batch fallback email thread must be seeded');
              if (row.gmailMessageIds.includes(email.data.gmailMessageId)) return;

              const { message, gmailThreadId } = await createEmailMessage(email, sender, {
                gmailThreadId: row.gmailThreadId,
                gmailMessageIds: row.gmailMessageIds,
              });

              try {
                const result = await client.sendEmail(message, gmailThreadId);
                logger.info('gmail batch fallback email sent successfully', {
                  'email.message.id': result.id,
                  'email.message.thread_id': result.threadId,
                  'email.message.internal_date': result.internalDate,
                  'email.message.label_ids': result.labelIds,
                });
                await appendGmailThreadMessageIds(tx, key, [email.data.gmailMessageId]);
                return result;
              } catch (cause) {
                if (cause instanceof GmailScopeError)
                  throw new NonRetriableError('missing gmail scopes', { cause });
                if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
                  throw new NonRetriableError(
                    'gmail batch fallback failed with non-retryable status',
                    { cause },
                  );
                throw cause;
              }
            },
            { isolationLevel: 'read committed' },
          );
        }),
    );
  },
);
