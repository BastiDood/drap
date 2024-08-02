import { error, fail, redirect } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';
import { validateEmail, validateString } from '$lib/forms';
import assert from 'node:assert/strict';
import groupBy from 'just-group-by';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

    const labs = await db.getLabRegistry();
    if (draft === null) return { draft: null, labs };

    const students = await db.getStudentsInDraftTaggedByLab(draft.draft_id);
    const { available, selected } = groupBy(students, ({ lab_id }) => (lab_id === null ? 'available' : 'selected'));
    return { draft, labs, available: available ?? [], selected: selected ?? [] };
}

function* mapRowTuples(data: FormData) {
    for (const [email, lab] of data.entries()) {
        if (lab instanceof File || lab.length === 0) continue;
        yield [validateEmail(email), lab] as const;
    }
}

const ZIP_NOT_EQUAL = Symbol('ZIP_NOT_EQUAL');

export const actions = {
    async init({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const isValid = await db.isValidTotalLabQuota();
        if (!isValid) error(403);

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
            assert(ackCount <= labCount);
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
        data.delete('draft');
        await db.insertLotteryChoices(draft, user.email, Array.from(mapRowTuples(data)));
    },
    async conclude({ locals: { db }, cookies, request }) {
        const sid = cookies.get('sid');
        if (typeof sid === 'undefined') error(401);

        const user = await db.getUserFromValidSession(sid);
        if (user === null) error(401);
        if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));

        // TODO: Assert that we are indeed in the lottery phase.

        try {
            db.logger.info(
                await db.begin(async db => {
                    const labs = await db.getLabRegistry();
                    const schedule = Array.from(roundrobin(...labs.map(({ lab_id, quota }) => repeat(lab_id, quota))));
                    const emails = await db.randomizeRemainingStudents(draft);
                    if (emails.length !== schedule.length) throw ZIP_NOT_EQUAL;

                    await db.insertLotteryChoices(draft, user.email, zip(emails, schedule));
                    const concludeDraft = await db.concludeDraft(draft);
                    if (!concludeDraft) error(400);

                    const syncDraftResultsToUsers = await db.syncDraftResultsToUsers(draft);
                    return { concludeDraft, syncDraftResultsToUsers };
                }),
            );
        } catch (err) {
            if (err === ZIP_NOT_EQUAL) return fail(403);
            throw err;
        }

        redirect(302, `/history/${draft}/`);
    },
};
