import type * as v from 'valibot';
import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import { assertDefined } from '$lib/server/assert';
import {
  createEmailMessage,
  isRetryableGmailStatus,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import {
  EmailBatchEvent,
  EmailSeedEvent,
  EmailSeedFallbackEvent,
} from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { lockGmailThreadsById, seedGmailThreadById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.seed';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const MAX_SEED_ATTEMPTS = 3;
type EmailSeedSchema = v.InferOutput<typeof EmailSeedEvent.schema>;

export const sendSeedEmails = inngest.createFunction(
  {
    id: 'send-seed-emails',
    name: 'Send Seed Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: EmailSeedEvent,
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const route = await step.run(
      { id: 'load-seed-email-threads', name: 'Load Seed Email Threads' },
      async () =>
        await tracer.asyncSpan(
          'load-seed-email-threads',
          async () =>
            await db.transaction(
              async tx => {
                const requestsByRowId = events.reduce((requestsByRowId, event) => {
                  const existing = requestsByRowId.get(event.data.gmailThreadRowId);
                  requestsByRowId.set(
                    event.data.gmailThreadRowId,
                    typeof existing === 'undefined'
                      ? event.data
                      : {
                          gmailThreadRowId: existing.gmailThreadRowId,
                          seed: existing.seed,
                          followers: [
                            event.data.seed,
                            ...existing.followers,
                            ...event.data.followers,
                          ],
                          attempt: Math.max(existing.attempt, event.data.attempt),
                        },
                  );
                  return requestsByRowId;
                }, new Map<number, EmailSeedSchema>());

                const rows = await lockGmailThreadsById(
                  tx,
                  requestsByRowId
                    .keys()
                    .map(id => BigInt(id))
                    .toArray(),
                );
                const rowsById = new Map(rows.values().map(row => [Number(row.id), row]));

                return requestsByRowId.values().reduce<{
                  pendingSeeds: EmailSeedSchema[];
                  readyBatches: v.InferOutput<typeof EmailBatchEvent.schema>[];
                }>(
                  (route, request) => {
                    const row = assertDefined(rowsById.get(request.gmailThreadRowId));
                    if (row.gmailThreadId === null) route.pendingSeeds.push(request);
                    else
                      route.readyBatches.push(
                        ...[request.seed, ...request.followers].map(email => ({
                          gmailThreadRowId: request.gmailThreadRowId,
                          email,
                          attempt: request.attempt,
                        })),
                      );
                    return route;
                  },
                  { pendingSeeds: [], readyBatches: [] },
                );
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    const sent = await step.run(
      { id: 'send-root-seed-emails', name: 'Send Root Seed Emails' },
      async () =>
        await tracer.asyncSpan('send-root-seed-emails', async () => {
          const successes: {
            gmailThreadRowId: number;
            gmailMessageId: string;
            gmailThreadId: string;
          }[] = [];
          const batchFollowups: v.InferOutput<typeof EmailBatchEvent.schema>[] = [
            ...route.readyBatches,
          ];
          const seedRetries: EmailSeedSchema[] = [];
          const seedFallbacks: EmailSeedSchema[] = [];

          if (route.pendingSeeds.length === 0)
            return { successes, batchFollowups, seedRetries, seedFallbacks };

          const { client, sender } = await getRefreshedCredentials();
          const messages = new Map<string, { message: MIMEMessage; gmailThreadId?: string }>();

          for (const request of route.pendingSeeds) {
            const { message } = await createEmailMessage(request.seed, sender);
            messages.set(String(request.gmailThreadRowId), { message });
          }

          logger.debug('sending root seed email batch', { 'messages.count': messages.size });
          let results: Awaited<ReturnType<typeof client.sendEmails>>;
          try {
            results = await client.sendEmails(messages);
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError(
                'gmail seed batch request failed with non-retryable status',
                {
                  cause,
                },
              );
            throw cause;
          }

          let failureCount = 0;

          for (const request of route.pendingSeeds) {
            const result = results.get(String(request.gmailThreadRowId));
            if (typeof result === 'undefined') throw new Error('missing gmail seed batch result');

            if (result.ok) {
              successes.push({
                gmailThreadRowId: request.gmailThreadRowId,
                gmailMessageId: result.value.id,
                gmailThreadId: result.value.threadId,
              });
              logger.info('gmail root seed email sent successfully', {
                'email.attempt': request.attempt,
                'email.message.id': result.value.id,
                'email.message.thread_id': result.value.threadId,
                'email.message.internal_date': result.value.internalDate,
                'email.message.label_ids': result.value.labelIds,
              });
              continue;
            }

            ++failureCount;
            const retryable = isRetryableGmailStatus(result.status);
            if (retryable && request.attempt < MAX_SEED_ATTEMPTS)
              seedRetries.push({ ...request, attempt: request.attempt + 1 });
            else seedFallbacks.push(request);
            logger.error('gmail root seed email failed', void 0, {
              'email.attempt': request.attempt,
              'error.gmail.response.status': result.status,
              'error.gmail.response.body': result.body,
              'error.retryable': retryable,
              'email.retry.scheduled': retryable && request.attempt < MAX_SEED_ATTEMPTS,
              'email.fallback.scheduled': !retryable || request.attempt >= MAX_SEED_ATTEMPTS,
            });
          }

          logger.info('gmail seed batch completed', {
            'messages.count': messages.size,
            'messages.success_count': successes.length,
            'messages.failure_count': failureCount,
          });
          return { successes, batchFollowups, seedRetries, seedFallbacks };
        }),
    );

    const metadata = await step.run(
      { id: 'fetch-root-seed-email-metadata', name: 'Fetch Root Seed Email Metadata' },
      async () =>
        await tracer.asyncSpan('fetch-root-seed-email-metadata', async () => {
          const metadata: {
            gmailThreadRowId: number;
            gmailMessageId: string;
            gmailThreadId: string;
            gmailMessageIdHeader: string;
          }[] = [];
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
                'gmail seed metadata request failed with non-retryable status',
                {
                  cause,
                },
              );
            throw cause;
          }

          for (const item of sent.successes) {
            const result = results.get(item.gmailMessageId);
            if (typeof result === 'undefined')
              throw new Error('missing gmail seed metadata result');
            if (!result.ok) {
              if (!isRetryableGmailStatus(result.status))
                throw new NonRetriableError(
                  'gmail seed metadata request failed with non-retryable status',
                  { cause: new GmailError(result.status, result.body) },
                );
              GmailError.throwNew(result.status, result.body);
            }
            metadata.push({ ...item, gmailMessageIdHeader: result.value });
          }
          return metadata;
        }),
    );

    const followerEvents = await step.run(
      { id: 'persist-root-seed-email-threads', name: 'Persist Root Seed Email Threads' },
      async () =>
        await tracer.asyncSpan(
          'persist-root-seed-email-threads',
          async () =>
            await db.transaction(
              async tx => {
                for (const item of metadata)
                  await seedGmailThreadById(tx, BigInt(item.gmailThreadRowId), item.gmailThreadId, [
                    item.gmailMessageIdHeader,
                  ]);

                const seededRowIds = new Set(metadata.values().map(item => item.gmailThreadRowId));
                return route.pendingSeeds.flatMap(request => {
                  if (!seededRowIds.has(request.gmailThreadRowId)) return [];
                  return request.followers.map(email => ({
                    gmailThreadRowId: request.gmailThreadRowId,
                    email,
                    attempt: 0,
                  }));
                });
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    const followups = [
      ...sent.batchFollowups.map(data => EmailBatchEvent.create(data)),
      ...sent.seedRetries.map(data => EmailSeedEvent.create(data)),
      ...sent.seedFallbacks.map(data => EmailSeedFallbackEvent.create(data)),
      ...followerEvents.map(data => EmailBatchEvent.create(data)),
    ];
    if (followups.length > 0) await step.sendEvent('dispatch-seed-followups', followups);
    return followups.length;
  },
);
