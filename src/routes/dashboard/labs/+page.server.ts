import { error } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    // TODO: Migrate to SQL pipelining.
    const [labs, draft] = await Promise.all([db.getLabRegistry(), db.getLatestDraft()]);
    return { labs, draft };
}

function* mapRowTuples(data: FormData) {
    for (const [key, value] of data.entries()) {
        if (value instanceof File || value.length === 0) continue;
        yield [key, parseInt(value, 10)] as [string, number];
    }
}

export const actions = {
    async lab({ locals: { db }, cookies, request }) {
        // [x]: Validate whether this user has permission to this action.
        // Resolved: Check if is_admin. I'm assuming only admins have this permission...
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin) error(403);

        // [x]: Check if a draft is currently active.
        // Resolved: Check the latestDraft, whose active period should be unbounded above, meaning it hasn't ended
        if (db.getLatestDraft() === null) error(409);

        const data = await request.formData();
        const id = validateString(data.get('id'));
        const lab = validateString(data.get('name'));
        const insertNewLab = await db.insertNewLab(id, lab);
        db.logger.info({ insertNewLab });
    },
    async quota({ locals: { db }, cookies, request }) {
        // [x]: Validate whether this user has permission to this action.
        // Resolved: Check if is_admin. I'm assuming only admins have this permission...
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin) error(403);

        // [x]: Check if a draft is currently active.
        // Resolved: Check the latestDraft, whose active period should be unbounded above, meaning it hasn't ended
        if (db.getLatestDraft() === null) error(409);

        const data = await request.formData();
        await db.updateLabQuotas(mapRowTuples(data));
    },
};
