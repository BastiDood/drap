import { error, redirect } from '@sveltejs/kit';

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
};
