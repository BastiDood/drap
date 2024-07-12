import assert from 'node:assert/strict';
import { error } from '@sveltejs/kit';
import groupBy from 'just-group-by';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);
    if (draft === null) error(499);

    // TODO: Migrate to SQL Pipelining
    const [labs, students] = await Promise.all([db.getLabRegistry(), db.getStudentsInDraftTaggedByLab(draft.draft_id)]);
    const { available, selected } = groupBy(students, ({ lab_id }) => (lab_id === null ? 'available' : 'selected'));
    return { draft, labs, available: available ?? [], selected: selected ?? [] };
}

function* mapRowTuples(data: FormData) {
    for (const [email, lab] of data.entries()) {
        if (lab instanceof File || lab.length === 0) continue;
        yield [email, lab] as const;
    }
}

export const actions = {
    async init({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const data = await request.formData();
        const rounds = parseInt(validateString(data.get('rounds')), 10);
        const initDraft = await db.initDraft(rounds);
        db.logger.info({ initDraft });
    },
    async start({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));

        const { labCount, studentCount } = await db.getLabCountAndStudentCount(draft);
        assert(labCount > 0);
        if (studentCount <= 0) error(403);

        await db.begin(async db => {
            const incrementDraftRound = await db.incrementDraftRound(draft);
            assert(incrementDraftRound !== null);
            db.logger.info({ incrementDraftRound });

            const ackCount = await db.autoAcknowledgeLabsWithoutPreferences(draft);
            assert(ackCount < labCount);
            db.logger.info({ autoAcknowledgeLabsWithoutPreferences: ackCount });
        });
    },
    async intervene({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        // TODO: Assert that we are indeed in the lottery phase.

        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));
        await db.insertLotteryChoices(draft, user.email, mapRowTuples(data));
    },
    async conclude({ locals: { db }, cookies }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        // TODO: Assert that we are indeed in the lottery phase.
        // TODO: Run randomization phase.
    },
};