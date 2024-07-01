export async function load({ locals: { db }, cookies }) {
    const sid = cookies.get('sid');
    return { user: typeof sid === 'undefined' ? null : await db.getUserFromValidSession(sid) };
}
