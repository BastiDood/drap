import assert from 'node:assert/strict';
import { error } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id === null) error(403);

    // TODO: Check if the lab already submitted their picks.
    const { lab, students, researchers } = await db.getLabAndRemainingStudentsInDraftWithLabPreference(
        draft.draft_id,
        user.lab_id,
    );
    if (lab === null) error(404);
    return { draft, lab, students, researchers };
}

export const actions = {
    async default({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id === null) error(403);

        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));
        const students = data.getAll('students').map(validateString);

        const { quota, selected } = await db.getLabQuotaAndSelectedStudentCountInDraft(draft, user.lab_id);
        assert(quota !== null);

        const total = selected + BigInt(students.length);
        if (quota < total) error(403);

        const lab = user.lab_id;
        const faculty = user.email;
        const insertFacultyChoice = await db.begin(db => db.insertFacultyChoice(draft, lab, faculty, students));
        if (insertFacultyChoice === null) error(404);
        db.logger.info({ insertFacultyChoice });

        // TODO: Check if we can proceed to the next draft round.
    },
};
