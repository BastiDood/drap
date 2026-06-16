import assert from 'node:assert/strict';

import { NonRetriableError } from 'inngest';

import {
  appendGmailThreadMessageIdsById,
  lockGmailThreadsById,
} from '$lib/server/database/drizzle';
import { assertSingle } from '$lib/server/assert';
import {
  createEmailMessage,
  isRetryableGmailStatus,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchEvent, EmailBatchFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.batch-fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const MAX_BLOCKED_ATTEMPTS = 8;

export const sendBatchEmailFallback = inngest.createFunction(
  {
    id: 'send-batch-email-fallback',
    name: 'Send Batch Email Fallback',
    triggers: EmailBatchFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const thread = await step.run(
      { id: 'load-batch-fallback-thread', name: 'Load Batch Fallback Thread' },
      async () =>
        await tracer.asyncSpan(
          'load-batch-fallback-thread',
          async () =>
            await db.transaction(
              async tx => {
                const row = assertSingle(
                  await lockGmailThreadsById(tx, [BigInt(event.data.gmailThreadRowId)]),
                );

                if (row.gmailThreadId === null) {
                  if (event.data.attempt >= MAX_BLOCKED_ATTEMPTS)
                    throw new Error('gmail thread still blocked after retry budget');
                  return {
                    gmailThreadId: null,
                    gmailMessageIds: [],
                    followup: {
                      ...event.data,
                      attempt: event.data.attempt + 1,
                    },
                  };
                }

                if (row.gmailMessageIds.length === 0)
                  throw new NonRetriableError('gmail thread has no persisted message ids');

                return {
                  gmailThreadId: row.gmailThreadId,
                  gmailMessageIds: row.gmailMessageIds,
                  followup: null,
                };
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    if (thread.followup !== null) {
      await step.sendEvent(
        'dispatch-blocked-batch-fallback',
        EmailBatchEvent.create(thread.followup),
      );
      return;
    }

    await step.run(
      { id: 'send-batch-fallback-email', name: 'Send Batch Fallback Email' },
      async () =>
        await tracer.asyncSpan('send-batch-fallback-email', async () => {
          const { client, sender } = await getRefreshedCredentials();
          assert(thread.gmailThreadId !== null, 'batch fallback email thread must be seeded');
          const { message, gmailThreadId } = await createEmailMessage(event.data.email, sender, {
            gmailThreadId: thread.gmailThreadId,
            gmailMessageIds: thread.gmailMessageIds,
          });

          try {
            const result = await client.sendEmail(message, gmailThreadId);
            logger.info('gmail batch fallback email sent successfully', {
              'email.attempt': event.data.attempt,
              'email.message.id': result.id,
              'email.message.thread_id': result.threadId,
              'email.message.internal_date': result.internalDate,
              'email.message.label_ids': result.labelIds,
            });
            const gmailMessageId = await client.getMessageIdHeader(result.id);
            await db.transaction(
              async tx => {
                await appendGmailThreadMessageIdsById(tx, BigInt(event.data.gmailThreadRowId), [
                  gmailMessageId,
                ]);
              },
              { isolationLevel: 'read committed' },
            );
            return result;
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError('gmail batch fallback failed with non-retryable status', {
                cause,
              });
            throw cause;
          }
        }),
    );
  },
);
