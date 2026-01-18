import * as v from 'valibot';
import { EventSchemas, Inngest } from 'inngest';

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
    // TODO: Valibot
  }),
});
