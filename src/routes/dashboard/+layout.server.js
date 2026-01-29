import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.dashboard.layout';
const logger = Logger.byName(SERVICE_NAME);

export function load({ locals: { session } }) {
  if (typeof session === 'undefined') {
    logger.trace('session-less dashboard access');
    return;
  }

  logger.info('dashboard access', { 'session.id': session.id, 'user.id': session.user?.id });
  return { user: session.user };
}
