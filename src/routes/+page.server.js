import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const actions = {
  async logout({ locals: { db, session }, cookies }) {
    if (typeof session === 'undefined') error(401);

    const deleted = await db.deleteValidSession(session.id);
    if (typeof deleted === 'undefined')
      db.logger.warn('attempt to delete non-existent/expired session');
    else db.logger.info({ deleteValidSession: deleted });

    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
    redirect(307, '/');
  },
  async dummy({ locals: { db, session }, cookies }) {
    if (typeof session === 'undefined') error(401);
    if (!dev) error(403);

    const emailLeader = crypto.randomUUID().slice(0, 8);
    const dummyEmail = `${emailLeader}@dummy.com`;

    // log the current user out
    const deleted = await db.deleteValidSession(session.id);
    if (typeof deleted === 'undefined')
      db.logger.warn('attempt to delete non-existent/expired session');
    else db.logger.info({ deleteValidSession: deleted });

    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });

    // log the dummy user in
    db.logger.warn({ dummyEmail }, 'inserting dummy user')
    const dummyUserId = await db.initUser(dummyEmail);
    const dummySessionId = await db.insertDummySession(dummyUserId);

    cookies.set('sid', dummySessionId, { path: '/', httpOnly: true, sameSite: 'lax' });
    redirect(307, '/');
  }
};
