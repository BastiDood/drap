import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';
import type { Span } from '@opentelemetry/api';

import { assertDefined } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  getGmailThreadKeyString,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import {
  EmailBatchEvent,
  EmailSeedEvent,
  EmailSeedFallbackEvent,
} from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import {
  getRefreshedCredentials,
  type RefreshedCredentials,
} from '$lib/server/inngest/functions/send-emails/auth';
import type { GmailBatchSendResult } from '$lib/server/google/http';
import { GmailError, GmailScopeError } from '$lib/server/google';
import {
  type GmailFailure,
  isRetryableGmailFailure,
  logGmailFailure,
} from '$lib/server/google/failure';
import { inngest } from '$lib/server/inngest/client';
import { lockGmailThreads, seedGmailThreadsById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { GmailRetryKind, getGmailRetryTimestamp, planGmailRetry } from './retry';
import {
  ManualMetadataReconciliationRequiredError,
  MissingGmailMetadataResultError,
  MissingGmailSeedBatchResultError,
} from './errors';

const SERVICE_NAME = 'inngest.functions.send-emails.seed';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

interface SeedRequest {
  key: ReturnType<typeof getGmailThreadKey>;
  data: EmailSeedEvent;
}

interface SeedSuccess {
  rowId: number;
  gmailMessageId: string;
  gmailThreadId: string;
  seedAttempt: number;
}

function recordManualSeedMetadataReconciliation(
  span: Span,
  successes: SeedSuccess[],
  error?: Error,
) {
  span.setAttributes({
    'email.reconciliation.required': true,
    'email.reconciliation.stage': 'gmail-metadata',
    'email.reconciliation.message.count': successes.length,
    'email.delivery.transport': 'batch',
    'email.delivery.attempt.max': Math.max(0, ...successes.map(item => item.seedAttempt)),
  });
  for (const success of successes)
    logger.fatal('gmail seed send requires manual metadata reconciliation', error, {
      'email.gmail_thread.row_id': String(success.rowId),
      'email.message.id': success.gmailMessageId,
      'email.message.thread_id': success.gmailThreadId,
    });
}

export const sendSeedEmails = inngest.createFunction(
  {
    id: 'send-seed-emails',
    name: 'Send Seed Emails',
    batchEvents: {
      maxSize: 10,
      timeout: '10s',
      key: 'event.data.seedAttempt',
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
    retries: 0,
    triggers: EmailSeedEvent,
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const { readyBatches, seedRetries, seedFallbacks, followerBatches } = await step.run(
      { id: 'seed-email-threads', name: 'Seed Email Threads' },
      async () => {
        const requests = groupSeedRequests(events);
        const credentials = await getRefreshedCredentials();
        return await seedEmailThreads(requests, credentials);
      },
    );

    const immediateFollowups = [
      ...readyBatches.map(data => EmailBatchEvent.create(data)),
      ...followerBatches.map(data => EmailBatchEvent.create(data)),
    ];
    if (immediateFollowups.length > 0)
      await step.sendEvent('dispatch-seed-followups', immediateFollowups);

    const delayedFollowups = [
      ...seedRetries.map(({ data, ts }) => EmailSeedEvent.create(data, { ts })),
      ...seedFallbacks.map(({ data, ts }) => EmailSeedFallbackEvent.create(data, { ts })),
    ];
    if (delayedFollowups.length === 0) return immediateFollowups.length;
    await step.sendEvent('dispatch-seed-email-retry', delayedFollowups);

    return immediateFollowups.length + delayedFollowups.length;
  },
);

function groupSeedRequests(events: Iterable<{ data: EmailSeedEvent }>) {
  const requestsByKey = new Map<string, SeedRequest>();
  for (const event of events) {
    const key = getGmailThreadKey(event.data.seed);
    const keyString = getGmailThreadKeyString(key);
    const existing = requestsByKey.get(keyString);
    requestsByKey.set(
      keyString,
      typeof existing === 'undefined'
        ? { key, data: event.data }
        : {
            key: existing.key,
            data: {
              seed: existing.data.seed,
              followers: [event.data.seed, ...existing.data.followers, ...event.data.followers],
              seedAttempt: Math.max(existing.data.seedAttempt, event.data.seedAttempt),
            },
          },
    );
  }
  return requestsByKey;
}

async function seedEmailThreads(
  requestsByKey: Map<string, SeedRequest>,
  credentials: RefreshedCredentials,
) {
  return await tracer.asyncSpan('seed-email-threads', async span => {
    span.setAttributes({
      'email.seed.request.count': requestsByKey.size,
      'email.seed.message.count': Array.from(requestsByKey.values()).reduce(
        (count, request) => count + 1 + request.data.followers.length,
        0,
      ),
      'email.seed.attempt.max': Math.max(
        0,
        ...Array.from(requestsByKey.values(), request => request.data.seedAttempt),
      ),
    });

    return await db.transaction(
      async tx => {
        const rows = await lockGmailThreads(
          tx,
          Array.from(requestsByKey.values(), request => request.key),
        );

        const rowsByKey = new Map(rows.map(row => [getGmailThreadKeyString(row), row]));
        const readyBatches: EmailBatchEvent[] = [];
        const pendingSeeds: { rowId: bigint; data: EmailSeedEvent }[] = [];

        for (const request of requestsByKey.values()) {
          const row = assertDefined(rowsByKey.get(getGmailThreadKeyString(request.key)));
          if (row.gmailThreadId === null) {
            pendingSeeds.push({ rowId: row.id, data: request.data });
            continue;
          }
          readyBatches.push(
            ...[request.data.seed, ...request.data.followers].map(email => ({
              email,
              batchAttempt: 0,
            })),
          );
        }

        const successes: SeedSuccess[] = [];
        const seedRetries: { data: EmailSeedEvent; ts: number }[] = [];
        const seedFallbacks: { data: EmailSeedFallbackEvent; ts: number }[] = [];

        if (pendingSeeds.length === 0)
          return { readyBatches, seedRetries, seedFallbacks, followerBatches: [] };

        const renderedMessages = await Promise.all(
          pendingSeeds.map(async request => {
            const { message } = await createEmailMessage(request.data.seed, credentials.sender);
            return { contentId: String(request.rowId), message };
          }),
        );
        const messages = new Map<string, { message: MIMEMessage; gmailThreadId?: string }>(
          renderedMessages.map(({ contentId, message }) => [contentId, { message }]),
        );

        logger.debug('sending root seed email batch', { 'messages.count': messages.size });

        let results: Awaited<ReturnType<typeof credentials.client.sendEmails>>;
        let outerFailure: GmailFailure | undefined;
        try {
          results = await credentials.client.sendEmails(messages);
        } catch (cause) {
          if (cause instanceof GmailScopeError)
            throw new NonRetriableError('missing gmail scopes', { cause });
          if (cause instanceof GmailError) {
            if (!isRetryableGmailFailure(cause.failure))
              throw new NonRetriableError(
                'gmail seed batch request failed with non-retryable status',
                { cause },
              );
            outerFailure = cause.failure;
            results = new Map<string, GmailBatchSendResult>(
              pendingSeeds.map(request => [
                String(request.rowId),
                { ok: false, failure: cause.failure },
              ]),
            );
          } else {
            throw new NonRetriableError('gmail seed batch send outcome is ambiguous', { cause });
          }
        }

        let failureCount = 0;
        for (const request of pendingSeeds) {
          const result = results.get(String(request.rowId));
          if (typeof result === 'undefined')
            throw new NonRetriableError('gmail seed batch send outcome is ambiguous', {
              cause: new MissingGmailSeedBatchResultError(Number(request.rowId)),
            });

          if (result.ok) {
            successes.push({
              rowId: Number(request.rowId),
              gmailMessageId: result.value.id,
              gmailThreadId: result.value.threadId,
              seedAttempt: request.data.seedAttempt,
            });
            logger.info('gmail root seed email sent successfully', {
              'email.message.id': result.value.id,
              'email.message.thread_id': result.value.threadId,
            });
            continue;
          }

          ++failureCount;
          span.setAttribute('email.seed.attempt', request.data.seedAttempt);
          if (typeof outerFailure === 'undefined') logGmailFailure(span, result.failure);

          const retryPlan = planGmailRetry(request.data.seedAttempt, result.failure);
          switch (retryPlan.kind) {
            case GmailRetryKind.Batch:
              seedRetries.push({
                data: { ...request.data, seedAttempt: retryPlan.attempt },
                ts: getGmailRetryTimestamp(retryPlan.attempt, result.failure),
              });
              break;
            case GmailRetryKind.Fallback:
              seedFallbacks.push({
                data: {
                  seed: request.data.seed,
                  followers: request.data.followers,
                },
                ts: getGmailRetryTimestamp(retryPlan.attempt, result.failure),
              });
              break;
            case GmailRetryKind.Terminal:
              logger.error('gmail seed email failed with terminal status');
              break;
            case GmailRetryKind.Exhausted:
              logger.error('gmail seed email exhausted delivery attempts');
              break;
            default:
              throw new NonRetriableError('invalid gmail seed retry plan');
          }
        }

        logger.info('gmail seed batch completed', {
          'messages.count': messages.size,
          'messages.success_count': successes.length,
          'messages.failure_count': failureCount,
        });

        const metadata: {
          rowId: number;
          gmailThreadId: string;
          gmailMessageIdHeader: string;
        }[] = [];

        if (successes.length > 0) {
          // Keep Gmail metadata lookup in this transaction so seeded threads only become visible
          // after their Gmail thread ID and first `Message-ID` header can be persisted together.
          let metadataResults: Awaited<ReturnType<typeof credentials.client.getMessageIdHeaders>>;
          try {
            metadataResults = await credentials.client.getMessageIdHeaders(
              successes.map(item => item.gmailMessageId),
            );
          } catch (cause) {
            if (cause instanceof Error)
              recordManualSeedMetadataReconciliation(span, successes, cause);
            else recordManualSeedMetadataReconciliation(span, successes);
            throw new ManualMetadataReconciliationRequiredError({ cause });
          }

          for (const item of successes) {
            const result = metadataResults.get(item.gmailMessageId);
            if (typeof result === 'undefined') {
              const cause = new MissingGmailMetadataResultError(item.gmailMessageId);
              recordManualSeedMetadataReconciliation(span, successes, cause);
              throw new ManualMetadataReconciliationRequiredError({ cause });
            }
            if (!result.ok) {
              logGmailFailure(span, result.failure);
              const cause = new GmailError(result.failure);
              recordManualSeedMetadataReconciliation(span, successes, cause);
              throw new ManualMetadataReconciliationRequiredError({ cause });
            }
            metadata.push({
              rowId: item.rowId,
              gmailThreadId: item.gmailThreadId,
              gmailMessageIdHeader: result.value,
            });
          }
        }

        await seedGmailThreadsById(
          tx,
          metadata.map(item => ({
            id: BigInt(item.rowId),
            gmailThreadId: item.gmailThreadId,
            gmailMessageIds: [item.gmailMessageIdHeader],
          })),
        );

        const seededRowIds = new Set(metadata.map(item => item.rowId));
        const followerBatches = pendingSeeds.flatMap(request => {
          if (!seededRowIds.has(Number(request.rowId))) return [];
          return request.data.followers.map(email => ({
            email,
            batchAttempt: 0,
          }));
        });

        return { readyBatches, seedRetries, seedFallbacks, followerBatches };
      },
      { isolationLevel: 'read committed' },
    );
  });
}
