import { error } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (user.is_admin || user.user_id === null || user.lab_id === null) error(403);
    return await db.getLabMembers(user.lab_id);
}
