import { NonRetriableError } from 'inngest';

import { assertDefined } from '$lib/server/assert';
import { db } from '$lib/server/database';
import { EmailBatchEvent, EmailEvent, EmailSeedEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import {
  getGmailThreadKey,
  getGmailThreadKeyString,
} from '$lib/server/inngest/functions/send-emails/event';
import { type GmailThreadKey, lockOrCreateGmailThreads } from '$lib/server/database/drizzle';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.route';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const routeEmails = inngest.createFunction(
  {
    id: 'route-emails',
    name: 'Route Emails',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: EmailEvent,
  },
  async ({ events, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const routedEvents = await step.run(
      { id: 'route-emails', name: 'Route Emails' },
      async () => await routeEmailEvents(events),
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

function groupEmailsByThreadKey(events: IteratorObject<{ data: EmailEvent }>) {
  return events.reduce((groups, event) => {
    const email = event.data;
    const key = getGmailThreadKey(email);
    const keyString = getGmailThreadKeyString(key);
    const group = groups.get(keyString);
    if (typeof group === 'undefined') groups.set(keyString, { key, emails: [email] });
    else group.emails.push(email);
    return groups;
  }, new Map<string, { key: GmailThreadKey; emails: EmailEvent[] }>());
}

async function routeEmailEvents(events: { data: EmailEvent }[]) {
  return await tracer.asyncSpan(
    'route-emails',
    async () =>
      await db.transaction(
        async tx => {
          const groups = groupEmailsByThreadKey(events.values());
          const rows = await lockOrCreateGmailThreads(
            tx,
            Array.from(groups.values(), ({ key }) => key),
          );
          const rowsByKey = getGmailThreadRowsByKey(rows.values());
          const routedEvents = groups
            .values()
            .reduce<
              ({ type: 'seed'; data: EmailSeedEvent } | { type: 'batch'; data: EmailBatchEvent })[]
            >((routedEvents, group) => {
              const row = assertDefined(rowsByKey.get(getGmailThreadKeyString(group.key)));
              if (row.gmailThreadId === null) {
                const [seed, ...followers] = group.emails;
                routedEvents.push({
                  type: 'seed',
                  data: {
                    seed: assertDefined(seed),
                    followers,
                    seedAttempt: 0,
                  },
                });
              } else {
                routedEvents.push(
                  ...group.emails.map(email => ({
                    type: 'batch' as const,
                    data: {
                      email,
                      batchAttempt: 0,
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
  );
}

function getGmailThreadRowsByKey(
  rows: IteratorObject<{
    id: bigint;
    draftId: bigint;
    eventType: GmailThreadKey['eventType'];
    round: number | null;
    recipientUserId: string;
    gmailThreadId: string | null;
    gmailMessageIds: string[];
  }>,
) {
  return new Map(rows.map(row => [getGmailThreadKeyString(row), row]));
}
