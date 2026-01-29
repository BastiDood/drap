import { error, redirect } from '@sveltejs/kit';

import { db, deleteValidSession, insertDummySession, upsertOpenIdUser } from '$lib/server/database';
import { dev } from '$app/environment';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.oauth';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const actions = {
  async logout({ locals: { session }, cookies }) {
    if (typeof session === 'undefined') {
      logger.error('attempt to logout without session');
      error(401);
    }

    const { id: sessionId } = session;
    return await tracer.asyncSpan('action.logout', async span => {
      span.setAttribute('session.id', sessionId);

      const deleted = await deleteValidSession(db, sessionId);
      if (typeof deleted === 'undefined')
        logger.warn('attempt to delete non-existent/expired session');
      else
        logger.info('session deleted', {
          'session.user_id': deleted.userId,
          'session.expiration': deleted.expiration.toISOString(),
        });

      cookies.delete('sid', { path: '/dashboard', httpOnly: true, sameSite: 'lax' });
      redirect(303, '/');
    });
  },
  ...(dev
    ? {
        async dummy({ cookies }) {
          return await tracer.asyncSpan('action.dummy', async span => {
            const dummyId = crypto.randomUUID();
            const emailLeader = dummyId.slice(0, 8);
            const dummyEmail = `${emailLeader}@dummy.com`;

            span.setAttribute('user.email', dummyEmail);

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
            cookies.set('sid', dummySessionId, {
              path: '/dashboard',
              httpOnly: true,
              sameSite: 'lax',
            });
            redirect(303, '/dashboard/');
          });
        },
      }
    : null),
};
