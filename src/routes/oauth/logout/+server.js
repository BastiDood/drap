import { error } from '@sveltejs/kit';

export async function DELETE({ locals: { db }, cookies }) {
    const sid = cookies.get('sid');
    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
    if (typeof sid === 'undefined') error(401);

    const result = await db.deleteValidSession(sid);
    if (result === null) error(404);

    db.logger.info(result);
    return new Response(null, { status: 204 });
}
