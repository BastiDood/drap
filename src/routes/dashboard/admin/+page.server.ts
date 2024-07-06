import { error } from '@sveltejs/kit';

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
    async default({ locals: { db }, request }) {
        // TODO: Validate whether this user has permission to this action.
        const data = await request.formData();
        await db.updateLabQuotas(mapRowTuples(data));
    },
};
