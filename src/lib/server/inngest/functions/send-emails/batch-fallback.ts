import { and, eq, sql } from 'drizzle-orm';
import { NonRetriableError } from 'inngest';

import * as dbSchema from '$lib/server/database/schema';
import { appendGmailThreadMessageIdsById } from '$lib/server/database/drizzle';
import { assertSingle } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  getGmailThreadKeyString,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import {
  getRefreshedCredentials,
  type RefreshedCredentials,
} from '$lib/server/inngest/functions/send-emails/auth';
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
    triggers: EmailBatchFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    await step.run(
      { id: 'send-batch-fallback-email', name: 'Send Batch Fallback Email' },
      async () => {
        const credentials = await getRefreshedCredentials();
        return await sendBatchFallbackEmail(event.data, credentials);
      },
    );
  },
);

async function sendBatchFallbackEmail(
  event: EmailBatchFallbackEvent,
  credentials: RefreshedCredentials,
) {
  return await tracer.asyncSpan('send-batch-fallback-email', async span => {
    const key = getGmailThreadKey(event.email);
    span.setAttribute('email.gmail_thread.logical_key', getGmailThreadKeyString(key));
    return await db.transaction(
      async tx => {
        const thread = assertSingle(
          await tx
            .select({
              id: dbSchema.gmailThread.id,
              gmailThreadId: sql`${dbSchema.gmailThread.gmailThreadId}`.mapWith(value => {
                if (typeof value !== 'string')
                  throw new NonRetriableError(
                    'gmail thread must be seeded before batch fallback send',
                  );
                return value;
              }),
              gmailMessageIds: dbSchema.gmailThread.gmailMessageIds,
            })
            .from(dbSchema.gmailThread)
            .where(
              and(
                eq(dbSchema.gmailThread.draftId, key.draftId),
                eq(dbSchema.gmailThread.eventType, key.eventType),
                sql`${dbSchema.gmailThread.round} is not distinct from ${key.round}`,
                eq(dbSchema.gmailThread.recipientUserId, key.recipientUserId),
              ),
            )
            .for('update'),
        );

        if (thread.gmailMessageIds.length === 0)
          throw new NonRetriableError('gmail thread has no persisted message ids');

        const { message, gmailThreadId } = await createEmailMessage(
          event.email,
          credentials.sender,
          {
            gmailThreadId: thread.gmailThreadId,
            gmailMessageIds: thread.gmailMessageIds,
          },
        );

        try {
          const result = await credentials.client.sendEmail(message, gmailThreadId);
          logger.info('gmail batch fallback email sent successfully', {
            'email.message.id': result.id,
            'email.message.thread_id': result.threadId,
          });
          // Keep Gmail metadata lookup in this transaction so fallback sends only complete after
          // their `Message-ID` header has been appended to the local thread history.
          const gmailMessageId = await credentials.client.getMessageIdHeader(result.id);
          await appendGmailThreadMessageIdsById(tx, thread.id, [gmailMessageId]);
        } catch (cause) {
          if (cause instanceof GmailScopeError)
            throw new NonRetriableError('missing gmail scopes', { cause });
          if (cause instanceof GmailError)
            throw new NonRetriableError('gmail threaded email exhausted delivery attempts', {
              cause,
            });
          throw cause;
        }
      },
      { isolationLevel: 'read committed' },
    );
  });
}
