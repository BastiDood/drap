import { error, fail, redirect } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';
import { validateEmail, validateString } from '$lib/forms';
import type { User } from '$lib/server/database/schema';
import assert from 'node:assert/strict';
import groupBy from 'just-group-by';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access drafts page without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    db.logger.error(
      { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
      'insufficient permissions to access drafts page',
    );
    error(403);
  }

  const labs = await db.getLabRegistry();
  db.logger.info({ labCount: labs.length }, 'labs fetched');

  const { draft } = await parent();
  if (typeof draft === 'undefined') {
    db.logger.warn('no active draft found');
    return { draft: null, labs, available: [], selected: [], records: [] };
  }

  db.logger.info(draft, 'active draft found');

  const [students, records] = await Promise.all([
    db.getStudentsInDraftTaggedByLab(draft.id),
    db.getFacultyChoiceRecords(draft.id),
  ]);

  const { available = [], selected = [] } = groupBy(students, ({ labId }) =>
    labId === null ? 'available' : 'selected',
  );

  db.logger.info(
    {
      recordCount: records.length,
      availableCount: available.length,
      selectedCount: selected.length,
    },
    'draft records fetched',
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
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to init draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to init draft',
      );
      error(403);
    }

    const data = await request.formData();
    const rounds = parseInt(validateString(data.get('rounds')), 10);
    db.logger.info({ rounds }, 'initializing draft');

    const initDraft = await db.initDraft(rounds);
    db.logger.info(initDraft, 'draft initialized');
  },
  async start({ locals: { db, session, dispatch }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to start draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to start draft',
      );
      error(403);
    }

    const isValid = await db.isValidTotalLabQuota();
    if (!isValid) {
      db.logger.error('invalid total lab quota');
      return fail(498);
    }

    const data = await request.formData();
    const draftId = BigInt(validateString(data.get('draft')));
    db.logger.info({ draftId }, 'starting draft');

    const labCount = await db.getLabCount();
    assert(labCount > 0);

    const studentCount = await db.getStudentCountInDraft(draftId);
    if (studentCount <= 0) {
      db.logger.error('no students in draft');
      return fail(497);
    }

    const deferredNotifications: (number | null)[] = [];

    await db.begin(async db => {
      while (true) {
        const incrementDraftRound = await db.incrementDraftRound(draftId);
        assert(typeof incrementDraftRound !== 'undefined', 'cannot start a non-existent draft');
        db.logger.info(incrementDraftRound, 'draft round incremented');

        deferredNotifications.push(incrementDraftRound.currRound);

        // Pause at the lottery rounds
        if (incrementDraftRound.currRound === null) {
          db.logger.info('lottery round reached');
          break;
        }

        await db.autoAcknowledgeLabsWithoutPreferences(draftId);
        db.logger.info('labs without preferences auto-acknowledged');

        const count = await db.getPendingLabCountInDraft(draftId);
        if (count > 0) {
          db.logger.info({ pendingLabCount: count }, 'more pending labs found');
          break;
        }
      }
    });

    await dispatch.bulkDispatchDraftRoundStartNotification(deferredNotifications.map(round => {
      return {draftId, draftRound: round};
    }));

    db.logger.info('draft officially started');
  },
  async intervene({ locals: { db, session, dispatch }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to intervene draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to intervene draft',
      );
      error(403);
    }

    // TODO: Assert that we are indeed in the lottery phase.

    const data = await request.formData();
    const draftId = BigInt(validateString(data.get('draft')));
    db.logger.info({ draftId }, 'intervening draft');
    data.delete('draft');

    const pairs = Array.from(mapRowTuples(data));
    if (pairs.length === 0) {
      db.logger.info('no pairs to intervene');
      return;
    }

    db.logger.info({ pairs }, 'intervening draft');

    await db.insertLotteryChoices(draftId, user.id, pairs);

    const jobs = await Promise.all(pairs.map(async ([studentUserId, labId]) => {
      const [{ name: labName }, studentUser] = await Promise.all([db.getLabById(labId), db.getUserById(studentUserId)]);
      return {
        labId,
        labName,
        givenName: studentUser.givenName,
        familyName: studentUser.familyName,
        email: studentUser.email,
        draftId
      };
    }))

    await dispatch.bulkDispatchLotteryInterventionNotification(jobs)

    db.logger.info({ pairCount: pairs.length }, 'draft intervened');
  },
  async conclude({ locals: { db, session, dispatch }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to conclude draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to conclude draft',
      );
      error(403);
    }

    const data = await request.formData();
    const draftId = BigInt(validateString(data.get('draft')));
    db.logger.info({ draftId }, 'concluding draft');

    // TODO: Assert that we are indeed in the lottery phase.

    let deferredNotifications: [string, string][] = [];
    let draftResults: { user: User; labId: string }[] = [];

    try {
      await db.begin(async db => {
        const labs = await db.getLabRegistry();
        const schedule = Array.from(roundrobin(...labs.map(({ id, quota }) => repeat(id, quota))));
        db.logger.info({ schedule }, 'round-robin schedule generated');

        const emails = await db.randomizeRemainingStudents(draftId);
        db.logger.info({ emails }, 'randomized student queue generated');

        if (emails.length !== schedule.length) {
          db.logger.error(
            { scheduleCount: schedule.length, emailCount: emails.length },
            'schedule and quota mismatched',
          );
          throw ZIP_NOT_EQUAL;
        }

        const pairs = zip(emails, schedule);
        deferredNotifications = pairs;

        if (pairs.length > 0) {
          db.logger.info({ pairCount: pairs.length }, 'inserting lottery choices');
          await db.insertLotteryChoices(draftId, user.id, pairs);
        } else {
          // This only happens if all draft rounds successfully exhausted the student pool.
          db.logger.warn('no students remaining in the lottery');
        }

        const concludeDraft = await db.concludeDraft(draftId);
        db.logger.info({ concludeDraft }, 'draft concluded');

        draftResults = await db.syncResultsToUsers(draftId);
        db.logger.info({ draftResults }, 'draft results synced');
      });
    } catch (err) {
      if (err === ZIP_NOT_EQUAL) return fail(403);
      throw err;
    }

    const jobs = await Promise.all(deferredNotifications.map(async ([studentUserId, labId]) => {
      const [{ name: labName }, studentUser] = await Promise.all([db.getLabById(labId), db.getUserById(studentUserId)]);

      return {
        labId,
        labName,
        givenName: studentUser.givenName,
        familyName: studentUser.familyName,
        email: studentUser.email,
        draftId
      };
    }))

    await dispatch.bulkDispatchLotteryInterventionNotification(jobs)

    const userJobs = await Promise.all(draftResults.map(async ({ user, labId }) => {
      const { name } = await db.getLabById(labId);
      return {user, labName: name, labId};
    }))

    await dispatch.bulkDispatchUserNotification(userJobs);

    await dispatch.dispatchDraftConcludedNotification(draftId);

    redirect(303, `/history/${draftId}/`);
  },
};
