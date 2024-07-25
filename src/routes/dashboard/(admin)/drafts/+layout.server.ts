import { error } from '@sveltejs/kit';
import groupBy from 'just-group-by';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

    const labs = await db.getLabRegistry();
    if (draft === null) return { draft: null, labs };

    const students = await db.getStudentsInDraftTaggedByLab(draft.draft_id);
    const { available, selected } = groupBy(students, ({ lab_id }) => (lab_id === null ? 'available' : 'selected'));
    return { draft, labs, available: available ?? [], selected: selected ?? [] };
}