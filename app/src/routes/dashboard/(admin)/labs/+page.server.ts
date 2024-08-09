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
        yield [key, parseInt(value, 10)] as const;
    }
}

export const actions = {
    async lab({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const draft = await db.getActiveDraft();
        if (draft !== null) error(403);

        const data = await request.formData();
        const id = validateString(data.get('id'));
        const lab = validateString(data.get('name'));
        const insertNewLab = await db.insertNewLab(id, lab);
        db.logger.info({ insertNewLab });
    },
    async quota({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const draft = await db.getActiveDraft();
        if (draft !== null && draft.curr_round !== null && draft.curr_round > 0)
            error(403, 'It is unsafe to update the lab quota while a draft is ongoing.');

        const data = await request.formData();
        await db.updateLabQuotas(mapRowTuples(data));
    },
};
