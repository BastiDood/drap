import { error } from '@sveltejs/kit';
import { validateEmail } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    return { senders: await db.getCandidateSenders() };
}

export const actions = {
    async demote({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const data = await request.formData();
        const email = validateEmail(data.get('email'));
        if (await db.deleteDesignatedSender(email)) return;
        error(404, 'Designated sender does not exist.');
    },
    async promote({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const data = await request.formData();
        const email = validateEmail(data.get('email'));

        await db.begin(async db => {
            const upsertDesignatedSender = await db.upsertDesignatedSender(email);
            db.logger.info({ upsertDesignatedSender });
            await db.notifyDraftChannel();
            await db.notifyUserChannel();
        });
    },
    async remove({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const data = await request.formData();
        const email = validateEmail(data.get('email'));
        if (await db.deleteCandidateSender(email)) return;
        error(404, 'Sender email does not exist.');
    },
};
