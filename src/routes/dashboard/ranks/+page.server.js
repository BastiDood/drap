import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    // TODO: Check if the user previously voted.
    const { user } = await parent();
    if (user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    if (user.student_number === null) redirect(302, '/profile/');
    const [availableLabs, draft] = await Promise.all([db.getAvailableLabs(), db.getLatestDraft()]);
    return { availableLabs, draft };
}

// TODO: Ensure all submissions have student numbers.
