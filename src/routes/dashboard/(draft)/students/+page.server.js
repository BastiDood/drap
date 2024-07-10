import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id === null) error(403);
    if (user.student_number === null) redirect(302, '/profile/');
    const students = await db.getStudentsInDraftWithLabPreference(draft.draft_id, user.lab_id);
    return { draft, students };
}

// TODO(actions): Check lab quota.
