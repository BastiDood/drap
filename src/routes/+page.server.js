import { error, redirect } from '@sveltejs/kit';

import { db, deleteValidSession, insertDummySession, upsertOpenIdUser } from '$lib/server/database';
import { dev } from '$app/environment';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.index';
const logger = Logger.byName(SERVICE_NAME);

export const actions = {
  async logout({ locals: { session }, cookies }) {
    if (typeof session === 'undefined') {
      logger.error('attempt to logout without session');
      error(401);
    }

    const deleted = await deleteValidSession(db, session.id);
    if (typeof deleted === 'undefined')
      logger.warn('attempt to delete non-existent/expired session');
    else
      logger.info('session deleted', {
        'auth.session.user_id': deleted.userId,
        'auth.session.expiration': deleted.expiration.toISOString(),
      });

    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
    redirect(303, '/');
  },
  ...(dev
    ? {
        async dummy({ cookies }) {
          const dummyId = crypto.randomUUID();
          const emailLeader = dummyId.slice(0, 8);
          const dummyEmail = `${emailLeader}@dummy.com`;

          // log the dummy user in
          logger.warn('inserting dummy user', { 'user.email': dummyEmail });
          const dummyUser = await upsertOpenIdUser(
            db,
            dummyEmail,
            crypto.randomUUID(), // HACK: this is not a valid Google account identifier.
            'Dummy',
            emailLeader,
            `https://avatar.vercel.sh/${dummyId}.svg`,
          );
          logger.info('dummy user inserted', dummyUser);

          const dummySessionId = await insertDummySession(db, dummyUser.id);
          cookies.set('sid', dummySessionId, { path: '/', httpOnly: true, sameSite: 'lax' });
          redirect(303, '/');
        },
      }
    : {}),
};
