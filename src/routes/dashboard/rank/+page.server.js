import { error } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    // TODO: Check if the user previously voted.
    const { user } = await parent();
    if (user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    const [availableLabs, draft] = await Promise.all([db.getAvailableLabs(), db.getLatestDraft()]);
    return { availableLabs, draft };
}
