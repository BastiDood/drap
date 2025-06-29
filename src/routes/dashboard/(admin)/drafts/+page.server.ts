import { error, fail, redirect } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';
import { validateEmail, validateString } from '$lib/forms';
import assert from 'node:assert/strict';
import groupBy from 'just-group-by';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

  const labs = await db.getLabRegistry();
  const { draft } = await parent();
  if (typeof draft === 'undefined')
    return { draft: null, labs, available: [], selected: [], records: [] };

  const [students, records] = await Promise.all([
    db.getStudentsInDraftTaggedByLab(draft.id),
    db.getFacultyChoiceRecords(draft.id),
  ]);

  const { available = [], selected = [] } = groupBy(students, ({ labId }) =>
    labId === null ? 'available' : 'selected',
  );
  return { draft, labs, available, selected, records };
}

function* mapRowTuples(data: FormData) {
  for (const [email, lab] of data.entries()) {
    if (lab instanceof File || lab.length === 0) continue;
    yield [validateEmail(email), lab] as const;
  }
}

const ZIP_NOT_EQUAL = Symbol('ZIP_NOT_EQUAL');

export const actions = {
  async init({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const data = await request.formData();
    const rounds = parseInt(validateString(data.get('rounds')), 10);
    const initDraft = await db.initDraft(rounds);
    db.logger.info({ initDraft });
  },
  async start({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const isValid = await db.isValidTotalLabQuota();
    if (!isValid) return fail(498);

    const data = await request.formData();
    const draft = BigInt(validateString(data.get('draft')));

    const labCount = await db.getLabCount();
    assert(labCount > 0);

    const studentCount = await db.getStudentCountInDraft(draft);
    if (studentCount <= 0) return fail(497);

    await db.begin(async db => {
      while (true) {
        const incrementDraftRound = await db.incrementDraftRound(draft);
        assert(typeof incrementDraftRound !== 'undefined', 'Cannot start a non-existent draft.');
        db.logger.info({ incrementDraftRound });

        // TODO: Reinstate notifications channel.
        // const postDraftRoundStartedNotification = await db.postDraftRoundStartedNotification(
        //     draft,
        //     incrementDraftRound.currRound,
        // );
        // db.logger.info({ postDraftRoundStartedNotification });
        // await db.notifyDraftChannel();

        // Pause at the lottery rounds
        if (incrementDraftRound.currRound === null) break;

        const autoAcknowledgeLabsWithoutPreferences =
          await db.autoAcknowledgeLabsWithoutPreferences(draft);
        db.logger.info({ autoAcknowledgeLabsWithoutPreferences });

        const count = await db.getPendingLabCountInDraft(draft);
        if (count > 0) break;
      }
    });
  },
  async intervene({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    // TODO: Assert that we are indeed in the lottery phase.

    const data = await request.formData();
    const draft = BigInt(validateString(data.get('draft')));
    data.delete('draft');

    const pairs = Array.from(mapRowTuples(data));
    if (pairs.length === 0) return;

    await db.begin(async db => {
      await db.insertLotteryChoices(draft, user.id, pairs);
      // TODO: Reinstate notifications channel.
      // await db.postLotteryInterventionNotifications(draft, pairs);
      // await db.notifyDraftChannel();
    });
  },
  async conclude({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const data = await request.formData();
    const draft = BigInt(validateString(data.get('draft')));

    // TODO: Assert that we are indeed in the lottery phase.

    try {
      await db.begin(async db => {
        const labs = await db.getLabRegistry();
        const schedule = Array.from(roundrobin(...labs.map(({ id, quota }) => repeat(id, quota))));
        const emails = await db.randomizeRemainingStudents(draft);
        if (emails.length !== schedule.length) throw ZIP_NOT_EQUAL;

        // TODO: Reinstate notifications channel.
        // await db.postLotteryInterventionNotifications(draft, pairs);
        const pairs = zip(emails, schedule);
        if (pairs.length > 0) await db.insertLotteryChoices(draft, user.id, pairs);

        const concludeDraft = await db.concludeDraft(draft);
        db.logger.info({ concludeDraft });
        if (!concludeDraft) error(400);

        // TODO: Reinstate notifications channel.
        // await db.postDraftConcluded(draft);
        // const syncDraftResultsToUsers = await db.syncDraftResultsToUsersWithNotification(draft);
        // db.logger.info({ syncDraftResultsToUsers });

        // TODO: Reinstate notifications channel.
        // await db.notifyDraftChannel();
        // await db.notifyUserChannel();
      });
    } catch (err) {
      if (err === ZIP_NOT_EQUAL) return fail(403);
      throw err;
    }

    redirect(307, `/history/${draft}/`);
  },
};
