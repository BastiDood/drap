import assert from 'node:assert/strict';
import { error } from '@sveltejs/kit';
import groupBy from 'just-group-by';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
    const { user } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

    const draft = await db.getLatestDraft();
    if (draft === null) error(499);

    const students = await db.getStudentsInDraftTaggedByLab(draft.draft_id);
    const { available, selected } = groupBy(students, ({ lab_id }) => (lab_id === null ? 'available' : 'selected'));
    return { draft, available: available ?? [], selected: selected ?? [] };
}

export const actions = {
    async init({ locals: { db }, request }) {
        // TODO: Check if the user has permissions to start a new draft.
        const data = await request.formData();
        const rounds = parseInt(validateString(data.get('rounds')), 10);
        const initDraft = await db.initDraft(rounds);
        db.logger.info({ initDraft });
    },
    async start({ locals: { db }, request }) {
        // TODO: Check if the user has permissions to start a new draft.
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
};
