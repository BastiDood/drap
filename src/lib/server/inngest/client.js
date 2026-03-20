import { extendedTracesMiddleware } from 'inngest/experimental';
import { Inngest } from 'inngest';

import { Logger } from '$lib/server/telemetry/logger';
import { version } from '$app/environment';

export const inngest = new Inngest({
  id: 'drap',
  appVersion: version,
  optimizeParallelism: true,
  checkpointing: true,
  middleware: [extendedTracesMiddleware({ behaviour: 'off' })],
  logger: Logger.byName('inngest-main'),
  internalLogger: Logger.byName('inngest-internal'),
});
