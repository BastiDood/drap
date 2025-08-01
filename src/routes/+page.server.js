import { error, redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';

export const actions = {
  async logout({ locals: { db, session }, cookies }) {
    if (typeof session === 'undefined') {
      db.logger.error('attempt to logout without session');
      error(401);
    }

    const deleted = await db.deleteValidSession(session.id);
    if (typeof deleted === 'undefined')
      db.logger.warn('attempt to delete non-existent/expired session');
    else db.logger.info({ deleteValidSession: deleted });

    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
    redirect(303, '/');
  },
  ...(dev
    ? {
        async dummy({ locals: { db }, cookies }) {
          const dummyId = crypto.randomUUID();
          const emailLeader = dummyId.slice(0, 8);
          const dummyEmail = `${emailLeader}@dummy.com`;

          // log the dummy user in
          db.logger.warn({ dummyEmail }, 'inserting dummy user');
          const dummyUser = await db.upsertOpenIdUser(
            dummyEmail,
            crypto.randomUUID(), // HACK: this is not a valid Google account identifier.
            'Dummy',
            emailLeader,
            `https://avatar.vercel.sh/${dummyId}.svg`,
          );
          db.logger.info(dummyUser, 'dummy user inserted');

          const dummySessionId = await db.insertDummySession(dummyUser.id);
          cookies.set('sid', dummySessionId, { path: '/', httpOnly: true, sameSite: 'lax' });
          redirect(303, '/');
        },
      }
    : {}),
};
