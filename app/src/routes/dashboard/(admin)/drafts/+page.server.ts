import { error, fail, redirect } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';
import { validateEmail, validateString } from '$lib/forms';
import assert from 'node:assert/strict';
import groupBy from 'just-group-by';

export async function load({ locals: { db }, parent }) {
    const { user, draft } = await parent();
    if (!user.is_admin || user.user_id === null || user.lab_id !== null) error(403);

    const labs = await db.getLabRegistry();
    if (draft === null) return { draft: null, labs, available: [], selected: [], records: [] };

    const [students, records] = await Promise.all([
        db.getStudentsInDraftTaggedByLab(draft.draft_id),
        db.getFacultyChoiceRecords(draft.draft_id),
    ]);

    const { available, selected } = groupBy(students, ({ lab_id }) => (lab_id === null ? 'available' : 'selected'));
    return { draft, labs, available: available ?? [], selected: selected ?? [], records };
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

        const isValid = await db.isValidTotalLabQuota();
        if (!isValid) return fail(498);

        const data = await request.formData();
        const draft = BigInt(validateString(data.get('draft')));

        const { labCount, studentCount } = await db.getLabCountAndStudentCount(draft);
        assert(labCount > 0);
        if (studentCount <= 0) return fail(497);

        await db.begin(async db => {
            while (true) {
                const incrementDraftRound = await db.incrementDraftRound(draft);
                assert(incrementDraftRound !== null, 'Cannot start a non-existent draft.');
                db.logger.info({ incrementDraftRound });

                const postDraftRoundStartedNotification = await db.postDraftRoundStartedNotification(
                    draft,
                    incrementDraftRound.curr_round,
                );
                db.logger.info({ postDraftRoundStartedNotification });
                await db.notifyDraftChannel();

                // Pause at the lottery rounds
                if (incrementDraftRound.curr_round === null) break;

                const autoAcknowledgeLabsWithoutPreferences = await db.autoAcknowledgeLabsWithoutPreferences(draft);
                db.logger.info({ autoAcknowledgeLabsWithoutPreferences });

                const count = await db.getPendingLabCountInDraft(draft);
                if (count > 0) break;
            }
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

        const pairs = Array.from(mapRowTuples(data));
        if (pairs.length === 0) return;

        await db.begin(async db => {
            await db.insertLotteryChoices(draft, user.email, pairs);
            await db.postLotteryInterventionNotifications(draft, pairs);
            await db.notifyDraftChannel();
        });
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
            await db.begin(async db => {
                const labs = await db.getLabRegistry();
                const schedule = Array.from(roundrobin(...labs.map(({ lab_id, quota }) => repeat(lab_id, quota))));
                const emails = await db.randomizeRemainingStudents(draft);
                if (emails.length !== schedule.length) throw ZIP_NOT_EQUAL;

                const pairs = zip(emails, schedule);
                if (pairs.length > 0) {
                    await db.insertLotteryChoices(draft, user.email, pairs);
                    await db.postLotteryInterventionNotifications(draft, pairs);
                }

                const concludeDraft = await db.concludeDraft(draft);
                db.logger.info({ concludeDraft });
                if (!concludeDraft) error(400);

                await db.postDraftConcluded(draft);
                await db.notifyDraftChannel();

                const syncDraftResultsToUsers = await db.syncDraftResultsToUsersWithNotification(draft);
                db.logger.info({ syncDraftResultsToUsers });
                await db.notifyUserChannel();
            });
        } catch (err) {
            if (err === ZIP_NOT_EQUAL) return fail(403);
            throw err;
        }

        redirect(302, `/history/${draft}/`);
    },
};
