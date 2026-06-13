import assert from 'node:assert/strict';

import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import { appendEmailThreadMessageIds, lockEmailThreads } from '$lib/server/database/drizzle';
import {
  createBatchEvent,
  createEmailMessage,
  getEmailThreadKeyString,
  getEmailThreadRowsByKey,
  groupEnvelopesByThreadKey,
  isRetryableGmailStatus,
  toBatchEnvelope,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import {
  DraftConcludedBatchEmailEvent,
  DraftFinalizationBatchEmailEvent,
  EmailBatchFallbackEvent,
  LotteryInterventionBatchEmailEvent,
  RoundStartedBatchEmailEvent,
  RoundSubmittedBatchEmailEvent,
  UserAssignedBatchEmailEvent,
} from '$lib/server/inngest/schema';
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

export const sendBatchedEmails = inngest.createFunction(
  {
    id: 'send-batched-emails',
    name: 'Send Batched Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: [
      RoundStartedBatchEmailEvent,
      RoundSubmittedBatchEmailEvent,
      LotteryInterventionBatchEmailEvent,
      DraftConcludedBatchEmailEvent,
      DraftFinalizationBatchEmailEvent,
      UserAssignedBatchEmailEvent,
    ],
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');
    const followupEvents = await step.run(
      { id: 'send-threaded-emails', name: 'Send Threaded Emails' },
      async () =>
        await tracer.asyncSpan('send-threaded-emails', async () => {
          const envelopes = events.map(event => {
            switch (event.name) {
              case 'draft/round.started.email.batch':
              case 'draft/round.submitted.email.batch':
              case 'draft/lottery.intervened.email.batch':
              case 'draft/draft.concluded.email.batch':
              case 'draft/draft.finalization.email.batch':
              case 'draft/user.assigned.email.batch':
                return toBatchEnvelope(event);
              default:
                throw new NonRetriableError(`unexpected event type: ${event.name}`);
            }
          });

          const groups = groupEnvelopesByThreadKey(envelopes);
          const { client, sender } = await getRefreshedCredentials();

          return await db.transaction(
            async tx => {
              const rows = await lockEmailThreads(
                tx,
                Array.from(groups.values(), ({ key }) => key),
              );
              const rowsByKey = getEmailThreadRowsByKey(rows);
              const keyByMessageId = new Map<string, string>();
              const messages = new Map<string, { message: MIMEMessage; gmailThreadId?: string }>();

              for (const group of groups.values()) {
                const row = rowsByKey.get(getEmailThreadKeyString(group.key));
                assert(typeof row !== 'undefined', 'batch email thread row must exist');
                assert(row.gmailThreadId !== null, 'batch email thread must already be seeded');

                for (const envelope of group.envelopes) {
                  keyByMessageId.set(
                    envelope.data.gmailMessageId,
                    getEmailThreadKeyString(group.key),
                  );
                  const rendered = await createEmailMessage(envelope, sender, {
                    gmailThreadId: row.gmailThreadId,
                    gmailMessageIds: row.gmailMessageIds,
                  });
                  messages.set(envelope.data.gmailMessageId, {
                    message: rendered.message,
                    gmailThreadId: rendered.gmailThreadId,
                  });
                }
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
                    { cause },
                  );
                throw cause;
              }

              let successCount = 0;
              let failureCount = 0;
              let retryCount = 0;
              let fallbackCount = 0;
              const followupEvents: (
                | ReturnType<typeof createBatchEvent>
                | ReturnType<typeof EmailBatchFallbackEvent.create>
              )[] = [];
              const successfulMessageIdsByKey = new Map<string, string[]>();

              for (const envelope of envelopes) {
                const result = results.get(envelope.data.gmailMessageId);
                assert(typeof result !== 'undefined', 'missing gmail batch result');
                const attempt = envelope.data.attempt ?? 0;

                if (result.ok) {
                  ++successCount;
                  logger.info('gmail threaded batch email sent successfully', {
                    'email.attempt': attempt,
                    'email.message.id': result.value.id,
                    'email.message.thread_id': result.value.threadId,
                    'email.message.internal_date': result.value.internalDate,
                    'email.message.label_ids': result.value.labelIds,
                  });

                  const key = keyByMessageId.get(envelope.data.gmailMessageId);
                  assert(typeof key !== 'undefined', 'missing email thread key for message id');
                  const successfulMessageIds = successfulMessageIdsByKey.get(key) ?? [];
                  successfulMessageIds.push(envelope.data.gmailMessageId);
                  successfulMessageIdsByKey.set(key, successfulMessageIds);
                  continue;
                }

                ++failureCount;
                const retryable = isRetryableGmailStatus(result.status);
                if (retryable && attempt < MAX_BATCH_ATTEMPTS) {
                  ++retryCount;
                  followupEvents.push(createBatchEvent(envelope, attempt + 1));
                } else {
                  ++fallbackCount;
                  followupEvents.push(EmailBatchFallbackEvent.create({ email: envelope }));
                }

                logger.error('gmail threaded batch email failed', void 0, {
                  'email.attempt': attempt,
                  'error.gmail.response.status': result.status,
                  'error.gmail.response.body': result.body,
                  'error.retryable': retryable,
                  'email.retry.scheduled': retryable && attempt < MAX_BATCH_ATTEMPTS,
                  'email.fallback.scheduled': !retryable || attempt >= MAX_BATCH_ATTEMPTS,
                });
              }

              for (const group of groups.values()) {
                const ids = successfulMessageIdsByKey.get(getEmailThreadKeyString(group.key));
                if (typeof ids !== 'undefined')
                  await appendEmailThreadMessageIds(tx, group.key, ids);
              }

              logger.info('gmail threaded batch completed', {
                'messages.count': messages.size,
                'messages.success_count': successCount,
                'messages.failure_count': failureCount,
                'messages.retryable_failure_count': retryCount,
                'messages.fallback_count': fallbackCount,
              });

              return followupEvents;
            },
            { isolationLevel: 'read committed' },
          );
        }),
    );

    if (followupEvents.length > 0) await step.sendEvent('dispatch-email-followups', followupEvents);
    return followupEvents.length;
  },
);
