import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import { assertDefined } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  getGmailThreadKeyString,
  isRetryableGmailStatus,
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
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { lockGmailThreads, seedGmailThreadsById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { MissingGmailMetadataResultError, MissingGmailSeedBatchResultError } from './errors';

const SERVICE_NAME = 'inngest.functions.send-emails.seed';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const MAX_SEED_ATTEMPTS = 3;

interface SeedRequest {
  key: ReturnType<typeof getGmailThreadKey>;
  data: EmailSeedEvent;
}

export const sendSeedEmails = inngest.createFunction(
  {
    id: 'send-seed-emails',
    name: 'Send Seed Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
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

    const followups = [
      ...readyBatches.map(data => EmailBatchEvent.create(data)),
      ...seedRetries.map(data => EmailSeedEvent.create(data)),
      ...seedFallbacks.map(data => EmailSeedFallbackEvent.create(data)),
      ...followerBatches.map(data => EmailBatchEvent.create(data)),
    ];

    if (followups.length > 0) await step.sendEvent('dispatch-seed-followups', followups);
    return followups.length;
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

        const successes: {
          rowId: number;
          gmailMessageId: string;
          gmailThreadId: string;
        }[] = [];
        const seedRetries: EmailSeedEvent[] = [];
        const seedFallbacks: EmailSeedFallbackEvent[] = [];

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
        try {
          results = await credentials.client.sendEmails(messages);
        } catch (cause) {
          if (cause instanceof GmailScopeError)
            throw new NonRetriableError('missing gmail scopes', { cause });
          if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
            throw new NonRetriableError(
              'gmail seed batch request failed with non-retryable status',
              { cause },
            );
          throw cause;
        }

        let failureCount = 0;
        for (const request of pendingSeeds) {
          const result = results.get(String(request.rowId));
          if (typeof result === 'undefined')
            throw new MissingGmailSeedBatchResultError(Number(request.rowId));

          if (result.ok) {
            successes.push({
              rowId: Number(request.rowId),
              gmailMessageId: result.value.id,
              gmailThreadId: result.value.threadId,
            });
            logger.info('gmail root seed email sent successfully', {
              'email.message.id': result.value.id,
              'email.message.thread_id': result.value.threadId,
              'email.message.internal_date': result.value.internalDate,
              'email.message.label_ids': result.value.labelIds,
            });
            continue;
          }

          ++failureCount;
          if (request.data.seedAttempt < MAX_SEED_ATTEMPTS)
            seedRetries.push({
              ...request.data,
              seedAttempt: request.data.seedAttempt + 1,
            });
          else
            seedFallbacks.push({
              seed: request.data.seed,
              followers: request.data.followers,
            });

          logger.error('gmail root seed email failed', void 0, {
            'email.seed.attempt': request.data.seedAttempt,
            'error.gmail.response.status': result.status,
            'error.gmail.response.body': result.body,
          });
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
          let metadataResults: Awaited<ReturnType<typeof credentials.client.getMessageIdHeaders>>;
          try {
            metadataResults = await credentials.client.getMessageIdHeaders(
              successes.map(item => item.gmailMessageId),
            );
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError(
                'gmail seed metadata request failed with non-retryable status',
                { cause },
              );
            throw cause;
          }

          for (const item of successes) {
            const result = metadataResults.get(item.gmailMessageId);
            if (typeof result === 'undefined')
              throw new MissingGmailMetadataResultError(item.gmailMessageId);
            if (!result.ok) {
              if (!isRetryableGmailStatus(result.status))
                throw new NonRetriableError(
                  'gmail seed metadata request failed with non-retryable status',
                  { cause: new GmailError(result.status, result.body) },
                );
              GmailError.throwNew(result.status, result.body);
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
