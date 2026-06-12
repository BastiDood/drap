import assert from 'node:assert/strict';

import { NonRetriableError } from 'inngest';

import { db } from '$lib/server/database';
import {
  DraftConcludedBatchEmailEvent,
  DraftConcludedFallbackEmailEvent,
  DraftFinalizationBatchEmailEvent,
  DraftFinalizationFallbackEmailEvent,
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
import { getUserByEmail, upsertEmailThread } from '$lib/server/database/drizzle';
import type { GmailBatchMetadataResult, GmailBatchSendResult } from '$lib/server/google/http';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import {
  createEmailMessage,
  getEmailThreadEventType,
  getEmailThreadRound,
  getRefreshedCredentials,
  isRetryableGmailStatus,
} from './shared';

const SERVICE_NAME = 'inngest.functions.send-email.batch';
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
  | ReturnType<typeof DraftConcludedBatchEmailEvent.create>
  | ReturnType<typeof DraftConcludedFallbackEmailEvent.create>
  | ReturnType<typeof DraftFinalizationBatchEmailEvent.create>
  | ReturnType<typeof DraftFinalizationFallbackEmailEvent.create>
  | ReturnType<typeof UserAssignedBatchEmailEvent.create>
  | ReturnType<typeof UserAssignedFallbackEmailEvent.create>;

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
      { id: 'send-emails', name: 'Send Emails' },
      async () =>
        await tracer.asyncSpan('send-emails', async () => {
          const eventsById = new Map(
            events.map(event => {
              switch (event.name) {
                case 'draft/round.started.email.batch':
                case 'draft/round.submitted.email.batch':
                case 'draft/lottery.intervened.email.batch':
                case 'draft/draft.concluded.email.batch':
                case 'draft/draft.finalization.email.batch':
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
          const successEmailIds: Map<string, { resultId: string }> = new Map();

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

              successEmailIds.set(contentId, { resultId: result.value.id });

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
                case 'draft/draft.concluded.email.batch':
                  followupEvents.push(
                    DraftConcludedBatchEmailEvent.create(
                      { ...event.data, attempt: nextAttempt },
                      options,
                    ),
                  );
                  break;
                case 'draft/draft.finalization.email.batch':
                  followupEvents.push(
                    DraftFinalizationBatchEmailEvent.create(
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
                case 'draft/draft.concluded.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    DraftConcludedFallbackEmailEvent.create({ id: event.id, ...data }, options),
                  );
                  break;
                }
                case 'draft/draft.finalization.email.batch': {
                  const { attempt: _, ...data } = event.data;
                  followupEvents.push(
                    DraftFinalizationFallbackEmailEvent.create({ id: event.id, ...data }, options),
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

          if (successEmailIds.size > 0) {
            let messageIdResults: Map<string, GmailBatchMetadataResult> | null = null;
            try {
              messageIdResults = await client.getEmailMessageIds(successEmailIds);
            } catch (error) {
              if (error instanceof Error) logger.error('failed to get email message ids', error);
            }

            if (messageIdResults !== null)
              for (const [contentId, result] of messageIdResults) {
                const event = eventsById.get(contentId);
                assert(typeof event !== 'undefined', 'missing event for gmail batch result');

                if (result.ok) {
                  const [gmailMessageIdObj] = result.value.payload.headers;
                  if (typeof gmailMessageIdObj === 'undefined') continue;
                  const { value: gmailMessageId } = gmailMessageIdObj;

                  logger.info('gmail batch email message ids retrieved successfully', {
                    'email.batch.content_id': contentId,
                    'email.message.id': result.value.id,
                    'email.message.message_id': gmailMessageId,
                  });

                  // Create/update the email thread
                  try {
                    const messageObj = messages.get(contentId);

                    if (typeof messageObj !== 'undefined') {
                      const { message } = messageObj;
                      const recipients = message.getRecipients();
                      const subject = message.getSubject();
        
                      if (typeof recipients !== 'undefined' && typeof subject !== 'undefined') {
                        const iterableRecipients = Array.isArray(recipients) ? recipients : [recipients];
        
                        for (const recipient of iterableRecipients) {
                          const recipientUserObj = await getUserByEmail(db, recipient.addr);
                          if (typeof recipientUserObj === 'undefined') continue;
        
                          const inngestEventName = getEmailThreadEventType(event);
                          const round = getEmailThreadRound(event);
        
                          await upsertEmailThread(
                            db,
                            BigInt(event.data.draftId),
                            inngestEventName,
                            round,
                            recipientUserObj.id,
                            result.value.threadId,
                            gmailMessageId,
                          );
                        }
                      }
                    }
                  } catch (error) {
                    if (error instanceof Error) logger.error('failed to update email thread', error);
                  }

                  continue;
                }
                  
                logger.error('failed to get email message id', void 0, {
                  'email.batch.content_id': contentId,
                  'error.gmail.response.status': result.status,
                  'error.gmail.response.body': result.body,
                });
              }
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
