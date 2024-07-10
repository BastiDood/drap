import { error } from '@sveltejs/kit';

export async function DELETE({ locals: { db }, cookies }) {
    const sid = cookies.get('sid');
    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
    if (typeof sid === 'undefined') error(401);

    const deleteValidSession = await db.deleteValidSession(sid);
    if (deleteValidSession === null) error(404);

    db.logger.info({ deleteValidSession });
    return new Response(null, { status: 204 });
}
