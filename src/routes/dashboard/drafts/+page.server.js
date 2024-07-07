import { error } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    return { draft: await db.getLatestDraft() };
}

export const actions = {
    async default({ locals: { db }, request }) {
        // TODO: Check if the user has permissions to start a new draft.
        const data = await request.formData();
        const rounds = parseInt(validateString(data.get('rounds')), 10);
        const result = await db.initDraft(rounds);
        db.logger.info(result);
    },
};
