export async function load({ locals: { db }, cookies }) {
    const sid = cookies.get('sid');
    if (typeof sid === 'undefined') return;
    const user = await db.getUserFromValidSession(sid);
    if (user === null) return;
    return { user };
}
