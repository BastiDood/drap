import type * as v from 'valibot';
import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import {
  appendGmailThreadMessageIdsById,
  lockGmailThreadsById,
} from '$lib/server/database/drizzle';
import { assertDefined } from '$lib/server/assert';
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

const SERVICE_NAME = 'inngest.functions.send-emails.batch';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const MAX_BATCH_ATTEMPTS = 3;
const MAX_BLOCKED_ATTEMPTS = 8;
type EmailBatchSchema = v.InferOutput<typeof EmailBatchEvent.schema>;

export const sendBatchedEmails = inngest.createFunction(
  {
    id: 'send-batched-emails',
    name: 'Send Batched Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: EmailBatchEvent,
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const route = await step.run(
      { id: 'load-threaded-email-threads', name: 'Load Threaded Email Threads' },
      async () =>
        await tracer.asyncSpan(
          'load-threaded-email-threads',
          async () =>
            await db.transaction(
              async tx => {
                const rows = await lockGmailThreadsById(
                  tx,
                  new Set(events.map(event => event.data.gmailThreadRowId))
                    .values()
                    .map(id => BigInt(id))
                    .toArray(),
                );
                const rowsById = new Map(rows.values().map(row => [Number(row.id), row]));

                return events.entries().reduce<{
                  blockedRequests: EmailBatchSchema[];
                  sendRequests: {
                    contentId: string;
                    gmailThreadRowId: number;
                    email: EmailBatchSchema['email'];
                    attempt: number;
                    gmailThreadId: string;
                    gmailMessageIds: string[];
                  }[];
                }>(
                  (route, [index, event]) => {
                    const row = assertDefined(rowsById.get(event.data.gmailThreadRowId));
                    if (row.gmailThreadId === null) {
                      if (event.data.attempt >= MAX_BLOCKED_ATTEMPTS)
                        throw new Error('gmail thread still blocked after retry budget');
                      route.blockedRequests.push({
                        ...event.data,
                        attempt: event.data.attempt + 1,
                      });
                    } else {
                      if (row.gmailMessageIds.length === 0)
                        throw new NonRetriableError('gmail thread has no persisted message ids');
                      route.sendRequests.push({
                        contentId: `${event.data.gmailThreadRowId}:${index}`,
                        gmailThreadRowId: event.data.gmailThreadRowId,
                        email: event.data.email,
                        attempt: event.data.attempt,
                        gmailThreadId: row.gmailThreadId,
                        gmailMessageIds: row.gmailMessageIds,
                      });
                    }
                    return route;
                  },
                  { blockedRequests: [], sendRequests: [] },
                );
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    const sent = await step.run(
      { id: 'send-threaded-emails', name: 'Send Threaded Emails' },
      async () =>
        await tracer.asyncSpan('send-threaded-emails', async () => {
          const successes: { gmailThreadRowId: number; gmailMessageId: string }[] = [];
          const batchFollowups: EmailBatchSchema[] = [...route.blockedRequests];
          const fallbackFollowups: EmailBatchSchema[] = [];

          if (route.sendRequests.length === 0)
            return { successes, batchFollowups, fallbackFollowups };

          const { client, sender } = await getRefreshedCredentials();
          const messages = new Map<string, { message: MIMEMessage; gmailThreadId?: string }>();

          for (const request of route.sendRequests) {
            const { message, gmailThreadId } = await createEmailMessage(request.email, sender, {
              gmailThreadId: request.gmailThreadId,
              gmailMessageIds: request.gmailMessageIds,
            });
            messages.set(request.contentId, { message, gmailThreadId });
          }

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
                {
                  cause,
                },
              );
            throw cause;
          }

          let failureCount = 0;
          let retryCount = 0;

          for (const request of route.sendRequests) {
            const result = results.get(request.contentId);
            if (typeof result === 'undefined') throw new Error('missing gmail batch result');

            if (result.ok) {
              successes.push({
                gmailThreadRowId: request.gmailThreadRowId,
                gmailMessageId: result.value.id,
              });
              logger.info('gmail threaded batch email sent successfully', {
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
            if (retryable && request.attempt < MAX_BATCH_ATTEMPTS) {
              ++retryCount;
              batchFollowups.push({
                gmailThreadRowId: request.gmailThreadRowId,
                email: request.email,
                attempt: request.attempt + 1,
              });
            } else {
              fallbackFollowups.push({
                gmailThreadRowId: request.gmailThreadRowId,
                email: request.email,
                attempt: request.attempt,
              });
            }

            logger.error('gmail threaded batch email failed', void 0, {
              'email.attempt': request.attempt,
              'error.gmail.response.status': result.status,
              'error.gmail.response.body': result.body,
              'error.retryable': retryable,
              'email.retry.scheduled': retryable && request.attempt < MAX_BATCH_ATTEMPTS,
              'email.fallback.scheduled': !retryable || request.attempt >= MAX_BATCH_ATTEMPTS,
            });
          }

          logger.info('gmail threaded batch completed', {
            'messages.count': messages.size,
            'messages.success_count': successes.length,
            'messages.failure_count': failureCount,
            'messages.retryable_failure_count': retryCount,
            'messages.blocked_count': route.blockedRequests.length,
          });
          return { successes, batchFollowups, fallbackFollowups };
        }),
    );

    const metadata = await step.run(
      { id: 'fetch-threaded-email-metadata', name: 'Fetch Threaded Email Metadata' },
      async () =>
        await tracer.asyncSpan('fetch-threaded-email-metadata', async () => {
          const metadata: { gmailThreadRowId: number; gmailMessageIdHeader: string }[] = [];
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
              throw new Error('missing gmail threaded metadata result');
            if (!result.ok) {
              if (!isRetryableGmailStatus(result.status))
                throw new NonRetriableError(
                  'gmail threaded metadata request failed with non-retryable status',
                  { cause: new GmailError(result.status, result.body) },
                );
              GmailError.throwNew(result.status, result.body);
            }
            metadata.push({
              gmailThreadRowId: item.gmailThreadRowId,
              gmailMessageIdHeader: result.value,
            });
          }
          return metadata;
        }),
    );

    await step.run(
      { id: 'persist-threaded-email-metadata', name: 'Persist Threaded Email Metadata' },
      async () =>
        await tracer.asyncSpan(
          'persist-threaded-email-metadata',
          async () =>
            await db.transaction(
              async tx => {
                const idsByRowId = metadata.reduce((idsByRowId, item) => {
                  const ids = idsByRowId.get(item.gmailThreadRowId) ?? [];
                  ids.push(item.gmailMessageIdHeader);
                  idsByRowId.set(item.gmailThreadRowId, ids);
                  return idsByRowId;
                }, new Map<number, string[]>());
                for (const [rowId, ids] of idsByRowId)
                  await appendGmailThreadMessageIdsById(tx, BigInt(rowId), ids);
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    const followups = [
      ...sent.batchFollowups.map(data => EmailBatchEvent.create(data)),
      ...sent.fallbackFollowups.map(data => EmailBatchFallbackEvent.create(data)),
    ];
    if (followups.length > 0) await step.sendEvent('dispatch-threaded-email-followups', followups);
    return followups.length;
  },
);
