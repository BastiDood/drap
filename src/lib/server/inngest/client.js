import { EventSchemas, Inngest } from 'inngest';

import {
  DraftConcludedEvent,
  LotteryInterventionEvent,
  RoundStartedEvent,
  RoundSubmittedEvent,
  UserAssignedEvent,
} from '$lib/server/inngest/schema';
import { EVENT_KEY } from '$lib/server/env/inngest/event';
import { Logger } from '$lib/server/telemetry/logger';
import { version } from '$app/environment';

export const inngest = new Inngest({
  id: 'drap',
  appVersion: version,
  optimizeParallelism: true,
  checkpointing: true,
  logger: Logger.byName('inngest'),
  eventKey: EVENT_KEY,
  schemas: new EventSchemas().fromSchema({
    'draft/round.started': RoundStartedEvent,
    'draft/round.submitted': RoundSubmittedEvent,
    'draft/lottery.intervened': LotteryInterventionEvent,
    'draft/draft.concluded': DraftConcludedEvent,
    'draft/user.assigned': UserAssignedEvent,
  }),
});
