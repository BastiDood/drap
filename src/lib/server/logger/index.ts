import type { PrettyStream } from 'pino-pretty';
import { pino } from 'pino';

import { dev } from '$app/environment';

// eslint-disable-next-line @typescript-eslint/init-declarations
let stream: PrettyStream | undefined;
if (dev) {
  // Dynamic import is needed to remove from production builds.
  const { PinoPretty: pretty } = await import('pino-pretty');
  stream = pretty();
}

// This is only a base logger instance. We need to attach a request ID for each request.
export const logger = pino(stream);
