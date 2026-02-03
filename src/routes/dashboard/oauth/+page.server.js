import { error, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { deleteValidSession } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.oauth';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const actions = {
  async logout({ locals: { session }, cookies }) {
    if (typeof session === 'undefined') {
      logger.fatal('attempt to logout without session');
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
};
