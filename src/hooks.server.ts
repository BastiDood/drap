import { getDotPath, isValiError } from 'valibot';
import type { PrettyStream } from 'pino-pretty';
import { pino } from 'pino';

import { dev } from '$app/environment';

import * as POSTGRES from '$lib/server/env/postgres';
import { AssertionError } from 'assert';
import { Database } from '$lib/server/database';

// eslint-disable-next-line @typescript-eslint/init-declarations
let stream: PrettyStream | undefined;
if (dev) {
  // Dynamic import is needed to remove from production builds.
  const { PinoPretty: pretty } = await import('pino-pretty');
  stream = pretty();
}

// This is only a base logger instance. We need to attach a request ID for each request.
const logger = pino(stream);

export async function handle({ event, resolve }) {
  const { cookies, locals, request } = event;

  const requestLogger = logger.child({
    requestId: crypto.randomUUID(),
    method: request.method,
    url: request.url,
  });

  requestLogger.info('request initiated');

  locals.db = Database.fromUrl(POSTGRES.URL, requestLogger);

  const sid = cookies.get('sid');
  if (typeof sid !== 'undefined') {
    const user = await locals.db.getUserFromValidSession(sid);
    locals.session = { id: sid, user };
  }

  const start = performance.now();
  try {
    const response = await resolve(event);
    locals.db.logger.info({
      status: response.status,
      response_time: performance.now() - start,
    });
    return response;
  } catch (error) {
    locals.db.logger.error({ error, response_time: performance.now() - start });
    throw error;
  }
}

export function handleError({ error, event }) {
  if (isValiError(error)) {
    const valibotErrorPaths = error.issues
      .map(issue => getDotPath(issue))
      .filter(path => path !== null);
    event.locals.db.logger.fatal({ valibotErrorPaths }, error.message);
  } else if (error instanceof AssertionError) {
    event.locals.db.logger.fatal({ nodeAssertionError: error }, error.message);
  } else if (error instanceof Error) {
    event.locals.db.logger.fatal({ error }, error.message);
  } else {
    event.locals.db.logger.fatal({ unknownError: error });
  }
}
