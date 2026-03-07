import { EventSchemas, Inngest } from 'inngest';

import {
  DraftFinalizedEvent,
  LotteryInterventionEvent,
  RoundStartedEvent,
  RoundSubmittedEvent,
  UserAssignedEvent,
} from '$lib/server/inngest/schema';
import { Logger } from '$lib/server/telemetry/logger';
import { version } from '$app/environment';

export const inngest = new Inngest({
  id: 'drap',
  appVersion: version,
  optimizeParallelism: true,
  checkpointing: true,
  logger: Logger.byName('inngest'),
  schemas: new EventSchemas().fromSchema({
    'draft/round.started': RoundStartedEvent,
    'draft/round.submitted': RoundSubmittedEvent,
    'draft/lottery.intervened': LotteryInterventionEvent,
    'draft/draft.finalized': DraftFinalizedEvent,
    'draft/user.assigned': UserAssignedEvent,
  }),
});
