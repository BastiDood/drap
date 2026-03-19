import { Inngest } from 'inngest';

import { Logger } from '$lib/server/telemetry/logger';
import { version } from '$app/environment';

export const inngest = new Inngest({
  id: 'drap',
  appVersion: version,
  optimizeParallelism: true,
  checkpointing: true,
  logger: Logger.byName('inngest'),
});
