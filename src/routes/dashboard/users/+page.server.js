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
    async faculty({ locals: { db }, cookies, request }) {
        // [x]: Verify whether the user is an admin.
        // Resolved: Check if is_admin
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin) error(403);
        
        const data = await request.formData();
        const email = validateString(data.get('email'));
        const lab = validateString(data.get('invite'));
        if (await db.inviteNewFacultyOrStaff(email, lab)) return;
        return fail(409);
    },
};
