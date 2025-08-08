import { AssertionError } from 'node:assert';

import pino, { type Logger } from 'pino';
import { getDotPath, isValiError } from 'valibot';
import type { PrettyStream } from 'pino-pretty';

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

export function logError(logger: Logger, error: unknown) {
  if (isValiError(error)) {
    const valibotErrorPaths = error.issues
      .map(issue => getDotPath(issue))
      .filter(path => path !== null);
    logger.fatal({ valibotErrorPaths }, error.message);
  } else if (error instanceof AssertionError) {
    logger.fatal({ nodeAssertionError: error }, error.message);
  } else if (error instanceof Error) {
    logger.fatal({ error }, error.message);
  } else {
    logger.fatal({ unknownError: error });
  }
}
