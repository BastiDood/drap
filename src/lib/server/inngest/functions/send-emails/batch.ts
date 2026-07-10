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
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchEvent, EmailBatchFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import type { GmailBatchSendResult } from '$lib/server/google/http';
import { GmailError, GmailScopeError } from '$lib/server/google';
import {
  type GmailFailure,
  isRetryableGmailFailure,
  logGmailFailure,
} from '$lib/server/google/failure';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { GmailRetryKind, getGmailRetryTimestamp, planGmailRetry } from './retry';
import { MissingGmailBatchResultError, MissingGmailMetadataResultError } from './errors';

const SERVICE_NAME = 'inngest.functions.send-emails.batch';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

interface BatchSuccess {
  rowId: number;
  gmailMessageId: string;
  gmailThreadId: string;
  batchAttempt: number;
}

export const sendBatchedEmails = inngest.createFunction(
  {
    id: 'send-batched-emails',
    name: 'Send Batched Emails',
    batchEvents: {
      maxSize: 10,
      timeout: '10s',
      key: 'event.data.batchAttempt',
    },
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
    retries: 3,
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
        await tracer.asyncSpan('send-threaded-emails', async span => {
          span.setAttributes({
            'email.batch.request.count': requests.length,
            'email.batch.attempt.max': Math.max(
              0,
              ...requests.map(request => request.batchAttempt),
            ),
          });

          const successes: BatchSuccess[] = [];
          const batchRetries: { data: EmailBatchEvent; ts: number }[] = [];
          const fallbackFollowups: {
            data: EmailBatchFallbackEvent;
            ts: number;
          }[] = [];

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
          let outerFailure: GmailFailure | undefined;
          try {
            results = await client.sendEmails(messages);
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError) {
              if (!isRetryableGmailFailure(cause.failure))
                throw new NonRetriableError(
                  'gmail threaded batch request failed with non-retryable status',
                  { cause },
                );
              outerFailure = cause.failure;
              results = new Map<string, GmailBatchSendResult>(
                requests.map(request => [request.contentId, { ok: false, failure: cause.failure }]),
              );
            } else {
              throw new NonRetriableError('gmail threaded batch send outcome is ambiguous', {
                cause,
              });
            }
          }

          let failureCount = 0;
          for (const request of requests) {
            const result = results.get(request.contentId);
            if (typeof result === 'undefined')
              throw new NonRetriableError('gmail threaded batch send outcome is ambiguous', {
                cause: new MissingGmailBatchResultError(request.contentId),
              });

            if (result.ok) {
              successes.push({
                rowId: request.rowId,
                gmailMessageId: result.value.id,
                gmailThreadId: result.value.threadId,
                batchAttempt: request.batchAttempt,
              });
              logger.info('gmail threaded batch email sent successfully', {
                'email.message.id': result.value.id,
                'email.message.thread_id': result.value.threadId,
              });
              continue;
            }

            ++failureCount;
            span.setAttribute('email.batch.attempt', request.batchAttempt);
            if (typeof outerFailure === 'undefined') logGmailFailure(span, result.failure);

            const retryPlan = planGmailRetry(request.batchAttempt, result.failure);
            switch (retryPlan.kind) {
              case GmailRetryKind.Batch:
                batchRetries.push({
                  data: {
                    email: request.email,
                    batchAttempt: retryPlan.attempt,
                  },
                  ts: getGmailRetryTimestamp(retryPlan.attempt, result.failure),
                });
                break;
              case GmailRetryKind.Fallback:
                fallbackFollowups.push({
                  data: { email: request.email },
                  ts: getGmailRetryTimestamp(retryPlan.attempt, result.failure),
                });
                break;
              case GmailRetryKind.Terminal:
                logger.error('gmail threaded email failed with terminal status');
                break;
              case GmailRetryKind.Exhausted:
                logger.error('gmail threaded email exhausted delivery attempts');
                break;
              default:
                throw new NonRetriableError('invalid gmail threaded retry plan');
            }
          }

          logger.info('gmail threaded batch completed', {
            'messages.count': messages.size,
            'messages.success_count': successes.length,
            'messages.failure_count': failureCount,
            'email.batch.retry.count': batchRetries.length,
            'email.batch.fallback.count': fallbackFollowups.length,
          });

          return { successes, batchRetries, fallbackFollowups };
        }),
    );

    const metadata = await step.run(
      { id: 'fetch-threaded-email-metadata', name: 'Fetch Threaded Email Metadata' },
      async () =>
        await tracer.asyncSpan('fetch-threaded-email-metadata', async span => {
          span.setAttribute('email.batch.success.count', sent.successes.length);
          const metadata: { rowId: number; gmailMessageIdHeader: string }[] = [];
          if (sent.successes.length === 0) return metadata;

          span.setAttributes({
            'email.delivery.transport': 'batch',
            'email.delivery.attempt.max': Math.max(
              0,
              ...sent.successes.map(item => item.batchAttempt),
            ),
            'email.gmail_thread.row_ids': sent.successes.map(item => String(item.rowId)),
            'email.message.ids': sent.successes.map(item => item.gmailMessageId),
            'email.message.thread_ids': sent.successes.map(item => item.gmailThreadId),
          });

          const { client } = await getRefreshedCredentials();
          let results: Awaited<ReturnType<typeof client.getMessageIdHeaders>>;
          try {
            results = await client.getMessageIdHeaders(
              sent.successes.map(item => item.gmailMessageId),
            );
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailFailure(cause.failure))
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
              if (!isRetryableGmailFailure(result.failure)) {
                logGmailFailure(span, result.failure);
                throw new NonRetriableError(
                  'gmail threaded metadata request failed with non-retryable status',
                  { cause: new GmailError(result.failure) },
                );
              }
              GmailError.throwFailure(span, result.failure);
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
      ...sent.batchRetries.map(({ data, ts }) => EmailBatchEvent.create(data, { ts })),
      ...sent.fallbackFollowups.map(({ data, ts }) => EmailBatchFallbackEvent.create(data, { ts })),
    ];
    if (followups.length === 0) return 0;
    await step.sendEvent('dispatch-threaded-email-followups', followups);
    return followups.length;
  },
);

async function loadThreadedEmailRequests(events: { data: EmailBatchEvent }[]) {
  return await tracer.asyncSpan('load-threaded-email-threads', async span => {
    const keys = Array.from(
      new Map(
        events.map(event => {
          const key = getGmailThreadKey(event.data.email);
          return [getGmailThreadKeyString(key), key];
        }),
      ).values(),
    );

    span.setAttributes({
      'inngest.events.count': events.length,
      'email.batch.attempt.max': Math.max(0, ...events.map(event => event.data.batchAttempt)),
    });

    return await db.transaction(
      async tx => {
        const rows = await loadSeededGmailThreads(tx, keys);

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
    );
  });
}

async function persistThreadedEmailMetadata(
  metadata: { rowId: number; gmailMessageIdHeader: string }[],
) {
  return await tracer.asyncSpan('persist-threaded-email-metadata', async span => {
    span.setAttribute('email.batch.metadata.count', metadata.length);

    return await db.transaction(
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
    );
  });
}

async function loadSeededGmailThreads(tx: DrizzleTransaction, keys: GmailThreadKey[]) {
  return await tracer.asyncSpan('load-seeded-gmail-threads', async span => {
    span.setAttribute('email.gmail_thread.logical_key.count', keys.length);
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
  });
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
