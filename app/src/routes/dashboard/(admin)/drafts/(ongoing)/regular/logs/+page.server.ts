import { assert } from '$lib/assert';

export async function load({ locals: { db }, parent }) {
    const { available, selected, draft, labs } = await parent();

    assert(typeof draft !== 'undefined');
    const choiceRecords = await db.getFacultyChoiceRecords(draft.draft_id);
    return { available, selected, draft, labs, choiceRecords };
}
