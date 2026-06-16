import type * as v from 'valibot';
import { NonRetriableError } from 'inngest';

import { assertDefined } from '$lib/server/assert';
import { db } from '$lib/server/database';
import {
  DraftConcludedSeedEmailEvent,
  DraftFinalizationSeedEmailEvent,
  EmailBatchEvent,
  EmailSeedEvent,
  LotteryInterventionSeedEmailEvent,
  RoundStartedSeedEmailEvent,
  RoundSubmittedSeedEmailEvent,
  UserAssignedSeedEmailEvent,
} from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import {
  getGmailThreadKeyString,
  getGmailThreadRowsByKey,
  groupEmailsByThreadKey,
} from '$lib/server/inngest/functions/send-emails/event';
import { inngest } from '$lib/server/inngest/client';
import { lockOrCreateGmailThreads } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.route';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);
type EmailEnvelope = v.InferOutput<typeof EmailSeedEvent.schema>['seed'];

export const routeEmails = inngest.createFunction(
  {
    id: 'route-emails',
    name: 'Route Emails',
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

    const routedEvents = await step.run(
      { id: 'route-emails', name: 'Route Emails' },
      async () =>
        await tracer.asyncSpan(
          'route-emails',
          async () =>
            await db.transaction(
              async tx => {
                const emails = events.reduce<EmailEnvelope[]>((emails, event) => {
                  switch (event.name) {
                    case 'draft/round.started.email.seed':
                    case 'draft/round.submitted.email.seed':
                    case 'draft/lottery.intervened.email.seed':
                    case 'draft/draft.concluded.email.seed':
                    case 'draft/draft.finalization.email.seed':
                    case 'draft/user.assigned.email.seed':
                      emails.push(event);
                      break;
                    default:
                      throw new NonRetriableError(`unexpected email event type: ${event.name}`);
                  }
                  return emails;
                }, []);

                const groups = groupEmailsByThreadKey(emails.values());
                const rows = await lockOrCreateGmailThreads(
                  tx,
                  groups
                    .values()
                    .map(({ key }) => key)
                    .toArray(),
                );
                const rowsByKey = getGmailThreadRowsByKey(rows.values());

                const routedEvents = groups
                  .values()
                  .reduce<
                    (
                      | { type: 'seed'; data: v.InferOutput<typeof EmailSeedEvent.schema> }
                      | { type: 'batch'; data: v.InferOutput<typeof EmailBatchEvent.schema> }
                    )[]
                  >((routedEvents, group) => {
                    const row = assertDefined(rowsByKey.get(getGmailThreadKeyString(group.key)));
                    if (row.gmailThreadId === null) {
                      const [seed, ...followers] = group.emails;
                      routedEvents.push({
                        type: 'seed',
                        data: {
                          gmailThreadRowId: Number(row.id),
                          seed: assertDefined(seed),
                          followers,
                          attempt: 0,
                        },
                      });
                    } else {
                      routedEvents.push(
                        ...group.emails.map(email => ({
                          type: 'batch' as const,
                          data: {
                            gmailThreadRowId: Number(row.id),
                            email,
                            attempt: 0,
                          },
                        })),
                      );
                    }
                    return routedEvents;
                  }, []);

                logger.info('email routing completed', {
                  'email.count': events.length,
                  'email.routed_count': routedEvents.length,
                });
                return routedEvents;
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    if (routedEvents.length > 0)
      await step.sendEvent(
        'dispatch-routed-emails',
        routedEvents.map(event =>
          event.type === 'seed'
            ? EmailSeedEvent.create(event.data)
            : EmailBatchEvent.create(event.data),
        ),
      );
    return routedEvents.length;
  },
);
