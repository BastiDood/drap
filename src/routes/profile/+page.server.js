import { error, redirect } from '@sveltejs/kit';

export async function load({ parent }) {
    const { user } = await parent();
    if (user === null) redirect(302, '/oauth/login/');
    // TODO: Bounce already initialized users.
    return { user };
}

/** @param {FormDataEntryValue | null} param */
function validateString(param) {
    if (param === null || param instanceof File) error(400);
    return param;
}

/** @param {FormDataEntryValue | null} param */
function maybeValidateBigInt(param) {
    if (param instanceof File) error(400);
    if (param === null || param.length === 0) return null;
    return BigInt(param);
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
