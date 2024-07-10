import { error } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    return { students: await db.getStudentsInDraft(draft.draft_id) };
}

export const actions = {
    async init({ locals: { db }, request }) {
        // TODO: Check if the user has permissions to start a new draft.
        const data = await request.formData();
        const rounds = parseInt(validateString(data.get('rounds')), 10);
        const result = await db.initDraft(rounds);
        db.logger.info(result);
    },
    async start({ locals: { db }, request }) {
        // TODO: Check if the user has permissions to start a new draft.
        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));
        await db.begin(async db => {
            const count = await db.getStudentCountInDraft(draft);
            if (count <= 0) error(403);
            const result = await db.incrementDraftRound(draft);
            if (result === null) error(404);
            // TODO: Check if all labs have no more pending work.
        });
    },
};
