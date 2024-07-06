import { maybeValidateBigInt, validateString } from '$lib/forms';
import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
    const { user } = await parent();
    if (typeof user === 'undefined') redirect(302, '/oauth/login/');
    // TODO: Bounce already initialized users.
    return { user };
}

export const actions = {
    async default({ locals: { db }, request, cookies }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') redirect(302, '/oauth/login/');

        const data = await request.formData();
        const studentNumber = maybeValidateBigInt(data.get('student-number'));
        const given = validateString(data.get('given'));
        const family = validateString(data.get('family'));

        return await db.updateProfileBySession(sid, studentNumber, given, family);
    },
};
