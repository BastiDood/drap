import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.layout';
const logger = Logger.byName(SERVICE_NAME);

export function load({ locals: { session } }) {
  if (typeof session === 'undefined') {
    logger.trace('session-less page access');
    return;
  }

  logger.info('page access', { 'auth.session.id': session.id, 'user.id': session.user?.id });
  return { user: session.user };
}
