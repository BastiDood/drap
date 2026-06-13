import assert from 'node:assert/strict';

import type { MIMEMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

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
  DraftConcludedSeedEmailEvent,
  DraftFinalizationSeedEmailEvent,
  type EmailBatchEnvelopeSchema,
  EmailSeedFallbackEvent,
  LotteryInterventionSeedEmailEvent,
  RoundStartedSeedEmailEvent,
  RoundSubmittedSeedEmailEvent,
  UserAssignedSeedEmailEvent,
} from '$lib/server/inngest/schema';
import {
  type EmailThreadKey,
  lockOrCreateEmailThreads,
  seedEmailThread,
} from '$lib/server/database/drizzle';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.seed';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const MAX_SEED_ATTEMPTS = 3;

export const sendSeedEmails = inngest.createFunction(
  {
    id: 'send-seed-emails',
    name: 'Send Seed Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: [
      RoundStartedSeedEmailEvent,
      RoundSubmittedSeedEmailEvent,
      LotteryInterventionSeedEmailEvent,
      DraftConcludedSeedEmailEvent,
      DraftFinalizationSeedEmailEvent,
      UserAssignedSeedEmailEvent,
    ],
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');
    const followupEvents = await step.run(
      { id: 'route-seed-emails', name: 'Route Seed Emails' },
      async () =>
        await tracer.asyncSpan('route-seed-emails', async () => {
          const envelopes = events.map(event => {
            switch (event.name) {
              case 'draft/round.started.email.seed':
              case 'draft/round.submitted.email.seed':
              case 'draft/lottery.intervened.email.seed':
              case 'draft/draft.concluded.email.seed':
              case 'draft/draft.finalization.email.seed':
              case 'draft/user.assigned.email.seed':
                return toBatchEnvelope(event);
              default:
                throw new NonRetriableError(`unexpected event type: ${event.name}`);
            }
          });

          const groups = groupEnvelopesByThreadKey(envelopes);
          const { client, sender } = await getRefreshedCredentials();

          return await db.transaction(
            async tx => {
              const rows = await lockOrCreateEmailThreads(
                tx,
                Array.from(groups.values(), ({ key }) => key),
              );
              const rowsByKey = getEmailThreadRowsByKey(rows);

              const followupEvents: (
                | ReturnType<typeof createBatchEvent>
                | ReturnType<typeof EmailSeedFallbackEvent.create>
              )[] = [];
              const seedGroups: {
                key: EmailThreadKey;
                seed: EmailBatchEnvelopeSchema;
                followers: EmailBatchEnvelopeSchema[];
              }[] = [];

              for (const group of groups.values()) {
                const row = rowsByKey.get(getEmailThreadKeyString(group.key));
                assert(typeof row !== 'undefined', 'seed email thread row must exist');

                if (row.gmailThreadId !== null) {
                  for (const envelope of group.envelopes) {
                    if (row.gmailMessageIds.includes(envelope.data.gmailMessageId)) continue;
                    followupEvents.push(createBatchEvent(envelope));
                  }
                  continue;
                }

                const [seed, ...followers] = group.envelopes;
                assert(typeof seed !== 'undefined', 'seed group must contain an envelope');
                seedGroups.push({ key: group.key, seed, followers });
              }

              const messages = new Map<string, { message: MIMEMessage; gmailThreadId?: string }>();
              for (const { seed } of seedGroups) {
                const { message } = await createEmailMessage(seed, sender);
                messages.set(seed.data.gmailMessageId, { message });
              }

              if (messages.size === 0) return followupEvents;

              logger.debug('sending root seed email batch', {
                'messages.count': messages.size,
              });
              let results: Awaited<ReturnType<typeof client.sendEmails>>;
              try {
                results = await client.sendEmails(messages);
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

              let successCount = 0;
              let failureCount = 0;
              let fallbackCount = 0;

              for (const { key, seed, followers } of seedGroups) {
                const result = results.get(seed.data.gmailMessageId);
                assert(typeof result !== 'undefined', 'missing gmail seed batch result');
                const attempt = seed.data.attempt ?? 0;

                if (result.ok) {
                  ++successCount;
                  logger.info('gmail root seed email sent successfully', {
                    'email.attempt': attempt,
                    'email.message.id': result.value.id,
                    'email.message.thread_id': result.value.threadId,
                    'email.message.internal_date': result.value.internalDate,
                    'email.message.label_ids': result.value.labelIds,
                  });

                  await seedEmailThread(tx, key, result.value.threadId, [seed.data.gmailMessageId]);
                  for (const follower of followers) followupEvents.push(createBatchEvent(follower));
                  continue;
                }

                ++failureCount;
                const retryable = isRetryableGmailStatus(result.status);
                ++fallbackCount;
                if (retryable && attempt < MAX_SEED_ATTEMPTS)
                  followupEvents.push(
                    EmailSeedFallbackEvent.create({ seed, followers, attempt: attempt + 1 }),
                  );
                else followupEvents.push(EmailSeedFallbackEvent.create({ seed, followers }));

                logger.error('gmail root seed email failed', void 0, {
                  'email.attempt': attempt,
                  'error.gmail.response.status': result.status,
                  'error.gmail.response.body': result.body,
                  'error.retryable': retryable,
                  'email.fallback.scheduled': true,
                });
              }

              logger.info('gmail seed batch completed', {
                'messages.count': messages.size,
                'messages.success_count': successCount,
                'messages.failure_count': failureCount,
                'messages.fallback_count': fallbackCount,
              });

              return followupEvents;
            },
            { isolationLevel: 'read committed' },
          );
        }),
    );

    if (followupEvents.length > 0) await step.sendEvent('dispatch-seed-followups', followupEvents);
    return followupEvents.length;
  },
);
