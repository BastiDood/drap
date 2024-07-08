import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id === null) error(403);
    if (user.student_number === null) redirect(302, '/profile/');
    if (draft === null) return;
    const students = await db.getStudentsInLatestDraftWithLabPreference(draft.draft_id, user.lab_id);
    return { draft: { info: draft, students } };
}

// TODO(actions): Check lab quota.
