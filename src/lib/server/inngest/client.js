import { version } from '$app/environment';
import { Logger } from '$lib/server/telemetry/logger';
import { Inngest } from 'inngest';
import { extendedTracesMiddleware } from 'inngest/experimental';

export const inngest = new Inngest({
  id: 'drap',
  appVersion: version,
  optimizeParallelism: true,
  checkpointing: true,
  middleware: [extendedTracesMiddleware({ behaviour: 'off' })],
  logger: Logger.byName('inngest-main'),
  internalLogger: Logger.byName('inngest-internal'),
});
