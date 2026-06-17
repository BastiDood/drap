import { and, eq, or, sql } from 'drizzle-orm';
import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import * as dbSchema from '$lib/server/database/schema';
import {
  appendGmailThreadsMessageIdsById,
  type DrizzleTransaction,
  type GmailThreadKey,
} from '$lib/server/database/drizzle';
import { assertDefined } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  getGmailThreadKeyString,
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

import { MissingGmailBatchResultError, MissingGmailMetadataResultError } from './errors';

const SERVICE_NAME = 'inngest.functions.send-emails.batch';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);
const MAX_BATCH_ATTEMPTS = 3;

export const sendBatchedEmails = inngest.createFunction(
  {
    id: 'send-batched-emails',
    name: 'Send Batched Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: EmailBatchEvent,
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const requests = await step.run(
      { id: 'load-threaded-email-threads', name: 'Load Threaded Email Threads' },
      async () => await loadThreadedEmailRequests(events),
    );

    const sent = await step.run(
      { id: 'send-threaded-emails', name: 'Send Threaded Emails' },
      async () =>
        await tracer.asyncSpan('send-threaded-emails', async () => {
          const successes: { rowId: number; gmailMessageId: string }[] = [];
          const batchRetries: EmailBatchEvent[] = [];
          const fallbackFollowups: EmailBatchFallbackEvent[] = [];

          if (requests.length === 0) return { successes, batchRetries, fallbackFollowups };

          const { client, sender } = await getRefreshedCredentials();
          const renderedMessages = await Promise.all(
            requests.map(async request => {
              const { message, gmailThreadId } = await createEmailMessage(request.email, sender, {
                gmailThreadId: request.gmailThreadId,
                gmailMessageIds: request.gmailMessageIds,
              });
              return { contentId: request.contentId, message, gmailThreadId };
            }),
          );
          const messages = new Map<string, { message: MIMEMessage; gmailThreadId?: string }>(
            renderedMessages.map(({ contentId, message, gmailThreadId }) => [
              contentId,
              { message, gmailThreadId },
            ]),
          );

          logger.debug('sending threaded email batch', { 'messages.count': messages.size });
          let results: Awaited<ReturnType<typeof client.sendEmails>>;
          try {
            results = await client.sendEmails(messages);
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError(
                'gmail threaded batch request failed with non-retryable status',
                { cause },
              );
            throw cause;
          }

          let failureCount = 0;
          for (const request of requests) {
            const result = results.get(request.contentId);
            if (typeof result === 'undefined')
              throw new MissingGmailBatchResultError(request.contentId);

            if (result.ok) {
              successes.push({
                rowId: request.rowId,
                gmailMessageId: result.value.id,
              });
              logger.info('gmail threaded batch email sent successfully', {
                'email.message.id': result.value.id,
                'email.message.thread_id': result.value.threadId,
                'email.message.internal_date': result.value.internalDate,
                'email.message.label_ids': result.value.labelIds,
              });
              continue;
            }

            ++failureCount;
            if (request.batchAttempt < MAX_BATCH_ATTEMPTS)
              batchRetries.push({
                email: request.email,
                batchAttempt: request.batchAttempt + 1,
              });
            else
              fallbackFollowups.push({
                email: request.email,
              });

            logger.error('gmail threaded batch email failed', void 0, {
              'email.batch.attempt': request.batchAttempt,
              'error.gmail.response.status': result.status,
              'error.gmail.response.body': result.body,
            });
          }

          logger.info('gmail threaded batch completed', {
            'messages.count': messages.size,
            'messages.success_count': successes.length,
            'messages.failure_count': failureCount,
          });
          return { successes, batchRetries, fallbackFollowups };
        }),
    );

    const metadata = await step.run(
      { id: 'fetch-threaded-email-metadata', name: 'Fetch Threaded Email Metadata' },
      async () =>
        await tracer.asyncSpan('fetch-threaded-email-metadata', async () => {
          const metadata: { rowId: number; gmailMessageIdHeader: string }[] = [];
          if (sent.successes.length === 0) return metadata;
          const { client } = await getRefreshedCredentials();
          let results: Awaited<ReturnType<typeof client.getMessageIdHeaders>>;
          try {
            results = await client.getMessageIdHeaders(
              sent.successes.map(item => item.gmailMessageId),
            );
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError(
                'gmail threaded metadata request failed with non-retryable status',
                { cause },
              );
            throw cause;
          }

          for (const item of sent.successes) {
            const result = results.get(item.gmailMessageId);
            if (typeof result === 'undefined')
              throw new MissingGmailMetadataResultError(item.gmailMessageId);
            if (!result.ok) {
              if (!isRetryableGmailStatus(result.status))
                throw new NonRetriableError(
                  'gmail threaded metadata request failed with non-retryable status',
                  { cause: new GmailError(result.status, result.body) },
                );
              GmailError.throwNew(result.status, result.body);
            }
            metadata.push({
              rowId: item.rowId,
              gmailMessageIdHeader: result.value,
            });
          }
          return metadata;
        }),
    );

    await step.run(
      { id: 'persist-threaded-email-metadata', name: 'Persist Threaded Email Metadata' },
      async () => await persistThreadedEmailMetadata(metadata),
    );

    const followups = [
      ...sent.batchRetries.map(data => EmailBatchEvent.create(data)),
      ...sent.fallbackFollowups.map(data => EmailBatchFallbackEvent.create(data)),
    ];
    if (followups.length > 0) await step.sendEvent('dispatch-threaded-email-followups', followups);
    return followups.length;
  },
);

async function loadThreadedEmailRequests(events: { data: EmailBatchEvent }[]) {
  return await tracer.asyncSpan(
    'load-threaded-email-threads',
    async () =>
      await db.transaction(
        async tx => {
          const rows = await loadSeededGmailThreads(
            tx,
            Array.from(
              new Map(
                events.map(event => {
                  const key = getGmailThreadKey(event.data.email);
                  return [getGmailThreadKeyString(key), key];
                }),
              ).values(),
            ),
          );

          const rowsByKey = new Map(rows.map(row => [getGmailThreadKeyString(row), row]));
          return Array.from(events.entries(), ([index, event]) => {
            const key = getGmailThreadKey(event.data.email);
            const keyString = getGmailThreadKeyString(key);
            const row = assertDefined(rowsByKey.get(keyString));
            if (row.gmailMessageIds.length === 0)
              throw new NonRetriableError('gmail thread has no persisted message ids');
            return {
              contentId: `${keyString}:${index}`,
              rowId: Number(row.id),
              email: event.data.email,
              batchAttempt: event.data.batchAttempt,
              gmailThreadId: row.gmailThreadId,
              gmailMessageIds: row.gmailMessageIds,
            };
          });
        },
        { isolationLevel: 'read committed' },
      ),
  );
}

async function persistThreadedEmailMetadata(
  metadata: { rowId: number; gmailMessageIdHeader: string }[],
) {
  return await tracer.asyncSpan(
    'persist-threaded-email-metadata',
    async () =>
      await db.transaction(
        async tx => {
          const idsByRowId = metadata.reduce((idsByRowId, item) => {
            const ids = idsByRowId.get(item.rowId) ?? [];
            ids.push(item.gmailMessageIdHeader);
            idsByRowId.set(item.rowId, ids);
            return idsByRowId;
          }, new Map<number, string[]>());
          await appendGmailThreadsMessageIdsById(
            tx,
            Array.from(idsByRowId, ([rowId, gmailMessageIds]) => ({
              id: BigInt(rowId),
              gmailMessageIds,
            })),
          );
        },
        { isolationLevel: 'read committed' },
      ),
  );
}

async function loadSeededGmailThreads(tx: DrizzleTransaction, keys: GmailThreadKey[]) {
  if (keys.length === 0) return [];
  return await tx
    .select({
      id: dbSchema.gmailThread.id,
      draftId: dbSchema.gmailThread.draftId,
      eventType: dbSchema.gmailThread.eventType,
      round: dbSchema.gmailThread.round,
      recipientUserId: dbSchema.gmailThread.recipientUserId,
      gmailThreadId: sql`${dbSchema.gmailThread.gmailThreadId}`.mapWith(value => {
        if (typeof value !== 'string')
          throw new NonRetriableError('gmail thread must be seeded before batch send');
        return value;
      }),
      gmailMessageIds: dbSchema.gmailThread.gmailMessageIds,
    })
    .from(dbSchema.gmailThread)
    .where(getGmailThreadPredicate(keys))
    .for('update');
}

function getGmailThreadPredicate(keys: GmailThreadKey[]) {
  return or(
    ...keys.map(key =>
      and(
        eq(dbSchema.gmailThread.draftId, key.draftId),
        eq(dbSchema.gmailThread.eventType, key.eventType),
        sql`${dbSchema.gmailThread.round} is not distinct from ${key.round}`,
        eq(dbSchema.gmailThread.recipientUserId, key.recipientUserId),
      ),
    ),
  );
}
