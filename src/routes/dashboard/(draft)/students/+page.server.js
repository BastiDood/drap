import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id === null) error(403);
    if (user.student_number === null) redirect(302, '/profile/');
    // TODO: Check if the lab already submitted their picks.
    const { lab, students } = await db.getLabAndRemainingStudentsInDraftWithLabPreference(draft.draft_id, user.lab_id);
    if (lab === null) error(404);
    return { draft, lab, students };
}

// TODO(actions): Check lab quota.
