import { logError, logger } from '$lib/server/logger';
import { Database } from '$lib/server/database';
import { NotificationDispatcher } from '$lib/server/queue';

export async function handle({ event, resolve }) {
  const { cookies, locals, request, getClientAddress } = event;

  const requestLogger = logger.child({
    // The service may be behind a proxy, so don't trust the client address.
    clientAddress: getClientAddress(),
    realIp: request.headers.get('X-Real-IP'), // Nginx
    forwardedFor: request.headers.get('X-Forwarded-For'),
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
  logError(event.locals.db.logger, error);
}
