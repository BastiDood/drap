import { error, fail } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (user.is_admin || user.user_id === null || user.lab_id !== null || user.student_number === null) error(403);
    const info = (await db.getStudentRankings(draft.draft_id, user.email)) ?? (await db.getAvailableLabs());
    return { draft, info };
}

export const actions = {
    async default({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (user.is_admin || user.user_id === null || user.lab_id !== null || user.student_number === null) error(403);

        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));
        const labs = data.getAll('labs').map(validateString);

        const maxRounds = await db.getMaxRoundInDraft(draft);
        if (maxRounds === null) error(404);
        if (labs.length > maxRounds) error(400);

        if (await db.insertStudentRanking(draft, user.email, labs)) return;
        return fail(403);
    },
};
