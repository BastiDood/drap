import { building } from '$app/environment';

export async function load({ locals: { session } }) {
  // During prerendering (building), skip session handling
  if (building) return;

  const { Logger } = await import('$lib/server/telemetry/logger');
  const logger = Logger.byName('routes.layout');

  if (typeof session === 'undefined') {
    logger.trace('session-less page access');
    return;
  }

  logger.info('page access', { 'auth.session.id': session.id, 'user.id': session.user?.id });
  return { user: session.user };
}
