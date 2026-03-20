import assert from 'node:assert/strict';

import { NonRetriableError } from 'inngest';

import {
  DraftFinalizedBatchEmailEvent,
  DraftFinalizedFallbackEmailEvent,
  LotteryInterventionBatchEmailEvent,
  LotteryInterventionFallbackEmailEvent,
  RoundStartedBatchEmailEvent,
  RoundStartedFallbackEmailEvent,
  RoundSubmittedBatchEmailEvent,
  RoundSubmittedFallbackEmailEvent,
  UserAssignedBatchEmailEvent,
  UserAssignedFallbackEmailEvent,
} from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import type { GmailBatchSendResult } from '$lib/server/google/http';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { createEmailMessage, getRefreshedCredentials, isRetryableGmailStatus } from './shared';

const SERVICE_NAME = 'inngest.functions.send-email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const MAX_BATCH_ATTEMPTS = 3;

interface EventCreateOptions {
  ts?: number;
  v?: string;
}

type FollowupEvent =
  | ReturnType<typeof RoundStartedBatchEmailEvent.create>
  | ReturnType<typeof RoundStartedFallbackEmailEvent.create>
  | ReturnType<typeof RoundSubmittedBatchEmailEvent.create>
  | ReturnType<typeof RoundSubmittedFallbackEmailEvent.create>
  | ReturnType<typeof LotteryInterventionBatchEmailEvent.create>
  | ReturnType<typeof LotteryInterventionFallbackEmailEvent.create>
  | ReturnType<typeof DraftFinalizedBatchEmailEvent.create>
  | ReturnType<typeof DraftFinalizedFallbackEmailEvent.create>
  | ReturnType<typeof UserAssignedBatchEmailEvent.create>
  | ReturnType<typeof UserAssignedFallbackEmailEvent.create>;

export const sendBatchedEmails = inngest.createFunction(
  {
    id: 'send-email',
    name: 'Send Email',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: [
      RoundStartedBatchEmailEvent,
      RoundSubmittedBatchEmailEvent,
      LotteryInterventionBatchEmailEvent,
      DraftFinalizedBatchEmailEvent,
      UserAssignedBatchEmailEvent,
    ],
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');
    const followupEvents = await step.run(
      { id: 'send-emails', name: 'Send Emails' },
      async () =>
        await tracer.asyncSpan('send-emails', async () => {
          const eventsById = new Map(
            events.map(event => {
              switch (event.name) {
                case 'draft/round.started.email.batch':
                case 'draft/round.submitted.email.batch':
                case 'draft/lottery.intervened.email.batch':
                case 'draft/draft.finalized.email.batch':
                case 'draft/user.assigned.email.batch':
                  return [event.id, event] as const;
                default:
                  throw new NonRetriableError(`unexpected event type: ${event.name}`);
              }
            }),
          );

          const { client, sender } = await getRefreshedCredentials();

          const messageEntries = await Promise.all(
            Array.from(
              eventsById.entries(),
              async ([id, event]) => [id, await createEmailMessage(event, sender)] as const,
            ),
          );

          const messages = new Map(messageEntries);
          logger.debug('sending emails', { 'messages.count': messages.size });

          // eslint-disable-next-line @typescript-eslint/init-declarations
          let results: Map<string, GmailBatchSendResult>;
          try {
            results = await client.sendEmails(messages);
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError('gmail batch request failed with non-retryable status', {
                cause,
              });
            throw cause;
          }

          let successCount = 0;
          let failureCount = 0;
          let retryCount = 0;
          let fallbackCount = 0;
          const followupEvents: FollowupEvent[] = [];

          for (const [contentId, result] of results) {
            const event = eventsById.get(contentId);
            assert(typeof event !== 'undefined', 'missing event for gmail batch result');

            const attempt = event.data.attempt ?? 0;
            if (result.ok) {
              ++successCount;
              logger.info('gmail batch email sent successfully', {
                'email.attempt': attempt,
                'email.batch.content_id': contentId,
                'email.message.id': result.value.id,
                'email.message.thread_id': result.value.threadId,
                'email.message.internal_date': result.value.internalDate,
                'email.message.label_ids': result.value.labelIds,
              });
              continue;
            }

            ++failureCount;
            const retryable = isRetryableGmailStatus(result.status);

            if (retryable && attempt < MAX_BATCH_ATTEMPTS) {
              const nextAttempt = attempt + 1;
              const options: EventCreateOptions = {};
              if (typeof event.ts !== 'undefined') options.ts = event.ts;
              if (typeof event.v !== 'undefined') options.v = event.v;
              ++retryCount;
              switch (event.name) {
                case 'draft/round.started.email.batch':
                  followupEvents.push(
                    RoundStartedBatchEmailEvent.create(
                      { ...event.data, attempt: nextAttempt },
                      options,
                    ),
                  );
                  break;
                case 'draft/round.submitted.email.batch':
                  followupEvents.push(
                    RoundSubmittedBatchEmailEvent.create(
                      { ...event.data, attempt: nextAttempt },
                      options,
                    ),
                  );
                  break;
                case 'draft/lottery.intervened.email.batch':
                  followupEvents.push(
                    LotteryInterventionBatchEmailEvent.create(
                      { ...event.data, attempt: nextAttempt },
                      options,
                    ),
                  );
                  break;
                case 'draft/draft.finalized.email.batch':
                  followupEvents.push(
                    DraftFinalizedBatchEmailEvent.create(
                      { ...event.data, attempt: nextAttempt },
                      options,
                    ),
                  );
                  break;
                case 'draft/user.assigned.email.batch':
                  followupEvents.push(
                    UserAssignedBatchEmailEvent.create(
                      { ...event.data, attempt: nextAttempt },
                      options,
                    ),
                  );
                  break;
                default:
                  throw new Error('unreachable retry event type');
              }
            } else {
              const options: EventCreateOptions = {};
              if (typeof event.ts !== 'undefined') options.ts = event.ts;
              if (typeof event.v !== 'undefined') options.v = event.v;
              ++fallbackCount;
              switch (event.name) {
                case 'draft/round.started.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    RoundStartedFallbackEmailEvent.create({ id: event.id, ...data }, options),
                  );
                  break;
                }
                case 'draft/round.submitted.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    RoundSubmittedFallbackEmailEvent.create({ id: event.id, ...data }, options),
                  );
                  break;
                }
                case 'draft/lottery.intervened.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    LotteryInterventionFallbackEmailEvent.create(
                      { id: event.id, ...data },
                      options,
                    ),
                  );
                  break;
                }
                case 'draft/draft.finalized.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    DraftFinalizedFallbackEmailEvent.create({ id: event.id, ...data }, options),
                  );
                  break;
                }
                case 'draft/user.assigned.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    UserAssignedFallbackEmailEvent.create({ id: event.id, ...data }, options),
                  );
                  break;
                }
                default:
                  throw new Error('unreachable fallback event type');
              }
            }

            logger.error('gmail batch email failed', void 0, {
              'email.attempt': attempt,
              'email.batch.content_id': contentId,
              'error.gmail.response.status': result.status,
              'error.gmail.response.body': result.body,
              'error.retryable': retryable,
              'email.retry.scheduled': retryable && attempt < MAX_BATCH_ATTEMPTS,
              'email.fallback.scheduled': !retryable || attempt >= MAX_BATCH_ATTEMPTS,
            });
          }

          logger.info('gmail batch email completed', {
            'messages.count': messages.size,
            'messages.success_count': successCount,
            'messages.failure_count': failureCount,
            'messages.retryable_failure_count': retryCount,
            'messages.fallback_count': fallbackCount,
          });

          return followupEvents;
        }),
    );

    if (followupEvents.length > 0) await step.sendEvent('dispatch-email-followups', followupEvents);
    return followupEvents.length;
  },
);
