import { AssertionError } from 'node:assert';

import { getDotPath, isValiError } from 'valibot';
import { Worker } from 'bullmq';

import { NotificationDispatcher, QUEUE_NAME } from '$lib/server/email/dispatch';
import { Database } from '$lib/server/database';
import { JOB_CONCURRENCY } from '$lib/server/env';
import { connection } from '$lib/server/queue';
import { initializeProcessor } from '$lib/server/email';
import { logger } from '$lib/server/logger';

// This is the global email worker. Value is intentionally unused.
const _ = new Worker(
  QUEUE_NAME,
  initializeProcessor(
    Database.withLogger(logger.child({ notifications: 'worker-db' })),
    logger.child({ notifications: 'worker' }),
  ),
  { concurrency: JOB_CONCURRENCY, connection },
);

export async function handle({ event, resolve }) {
  const { cookies, locals, request } = event;

  const requestLogger = logger.child({
    requestId: crypto.randomUUID(),
    method: request.method,
    url: request.url,
  });

  requestLogger.info('request initiated');

  locals.db = Database.withLogger(logger.child({ notifications: 'app-db' }));
  locals.dispatch = new NotificationDispatcher(
    logger.child({ notifications: 'dispatch' }),
    locals.db,
  );

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
