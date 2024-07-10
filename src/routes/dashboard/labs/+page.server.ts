import { error } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    return { labs: await db.getLabRegistry() };
}

function* mapRowTuples(data: FormData) {
    for (const [key, value] of data.entries()) {
        if (value instanceof File || value.length === 0) continue;
        yield [key, parseInt(value, 10)] as [string, number];
    }
}

export const actions = {
    async lab({ locals: { db }, request }) {
        // TODO: Validate whether this user has permission to this action.
        // TODO: Check if a draft is currently active.
        const data = await request.formData();
        const id = validateString(data.get('id'));
        const lab = validateString(data.get('name'));
        const insertNewLab = await db.insertNewLab(id, lab);
        db.logger.info({ insertNewLab });
    },
    async quota({ locals: { db }, request }) {
        // TODO: Validate whether this user has permission to this action.
        // TODO: Check if a draft is currently active.
        const data = await request.formData();
        await db.updateLabQuotas(mapRowTuples(data));
    },
};
