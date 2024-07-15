import { error, redirect } from '@sveltejs/kit';

export const actions = {
    async logout({ locals: { db }, cookies }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const session = await db.deleteValidSession(sid);
        if (session === null) db.logger.warn('attempt to delete non-existent/expired session');
        else db.logger.info({ deleteValidSession: session });

        cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
        redirect(302, '/');
    },
};
