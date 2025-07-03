export function load({ locals: { db, session } }) {
  if (typeof session === 'undefined') {
    db.logger.trace('session-less page access');
    return;
  }

  db.logger.info({ sessionId: session.id, userId: session.user?.id }, 'page access');
  return { user: session.user };
}
