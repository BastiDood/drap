import { error, fail } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    // TODO: Migrate to SQL pipelining.
    const [labs, faculty] = await Promise.all([db.getLabRegistry(), db.getFacultyAndStaff()]);
    return { labs, faculty };
}

export const actions = {
    async faculty({ locals: { db }, request }) {
        // TODO: Verify whether the user is an admin.
        const data = await request.formData();
        const email = validateString(data.get('email'));
        const lab = validateString(data.get('invite'));
        if (await db.inviteNewFacultyOrStaff(email, lab)) return;
        return fail(409);
    },
};
