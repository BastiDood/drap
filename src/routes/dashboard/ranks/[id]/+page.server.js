import { error, fail, redirect } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, params: { id }, parent }) {
    const { user } = await parent();
    if (user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    if (user.student_number === null) redirect(302, '/profile/');

    const draftId = BigInt(id);
    const draft = await db.getDraftById(draftId);
    if (draft === null) error(404);

    const info = (await db.getStudentRankings(draftId, user.email)) ?? (await db.getAvailableLabs());
    return { draft, info };
}

export const actions = {
    async default({ locals: { db }, params: { id }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (user.is_admin || user.user_id === null || user.lab_id !== null || user.student_number === null) error(403);

        const data = await request.formData();
        const labs = data.getAll('labs').map(validateString);
        if (await db.insertStudentRanking(BigInt(id), user.email, labs)) return;
        return fail(403);
    },
};
