import { redirect } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    // TODO: Check if the user previously voted.
    const { user } = await parent();
    if (user.is_admin || user.user_id === null || user.lab_id !== null) redirect(302, '/dashboard/');
    const [availableLabs, draft] = await Promise.all([db.getLabRegistry(), db.getLatestDraft()]);
    return { availableLabs, draft };
}
