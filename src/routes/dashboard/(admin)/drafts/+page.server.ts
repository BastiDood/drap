import assert from 'node:assert/strict';

import groupBy from 'just-group-by';
import { error, fail, redirect } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';

import {
  autoAcknowledgeLabsWithoutPreferences,
  begin,
  concludeDraft,
  db,
  getFacultyChoiceRecords,
  getLabCount,
  getLabRegistry,
  getPendingLabCountInDraft,
  getStudentCountInDraft,
  getStudentsInDraftTaggedByLab,
  incrementDraftRound,
  initDraft,
  insertLotteryChoices,
  isValidTotalLabQuota,
  randomizeRemainingStudents,
  syncResultsToUsers,
} from '$lib/server/database';
import {
  createDraftConcludedNotification,
  createDraftLotteryInterventionNotification,
  createDraftRoundStartedNotification,
  createUserNotification,
  type Notification,
} from '$lib/server/models/notification';
import { dispatch } from '$lib/server/queue';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateEmail, validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.admin.drafts';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session }, parent }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access drafts page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.warn('insufficient permissions to access drafts page', {
      'auth.user.is_admin': user.isAdmin,
      'auth.user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const labs = await getLabRegistry(db);
  logger.debug('labs fetched', { 'lab.count': labs.length });

  const { draft } = await parent();
  if (typeof draft === 'undefined') {
    logger.debug('no active draft found');
    return { draft: null, labs, available: [], selected: [], records: [] };
  }

  logger.debug('active draft found', {
    'draft.id': draft.id.toString(),
    'draft.round.current': draft.currRound,
    'draft.round.max': draft.maxRounds,
  });

  const [students, records] = await Promise.all([
    getStudentsInDraftTaggedByLab(db, draft.id),
    getFacultyChoiceRecords(db, draft.id),
  ]);

  const { available = [], selected = [] } = groupBy(students, ({ labId }) =>
    labId === null ? 'available' : 'selected',
  );

  logger.debug('draft records fetched', {
    'draft.record_count': records.length,
    'draft.student.available_count': available.length,
    'draft.student.selected_count': selected.length,
  });

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
  async init({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to init draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to init draft', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.init', async () => {
      const data = await request.formData();
      const rounds = parseInt(validateString(data.get('rounds')), 10);
      const closesAt = new Date(validateString(data.get('closes-at')));
      logger.debug('initializing draft', {
        'draft.round.max': rounds,
        'draft.registration.closes_at': closesAt.toISOString(),
      });

      const draft = await initDraft(db, rounds, closesAt);
      logger.info('draft initialized', {
        'draft.id': draft.id.toString(),
        'draft.active_period_start': draft.activePeriodStart.toISOString(),
      });
    });
  },
  async start({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to start draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to start draft', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const isValid = await isValidTotalLabQuota(db);
    if (!isValid) {
      logger.warn('invalid total lab quota');
      return fail(498);
    }

    return await tracer.asyncSpan('action.start', async () => {
      const data = await request.formData();
      const draftId = BigInt(validateString(data.get('draft')));
      logger.debug('starting draft', { 'draft.id': draftId.toString() });

      const labCount = await getLabCount(db);
      assert(labCount > 0);

      const studentCount = await getStudentCountInDraft(db, draftId);
      if (studentCount <= 0) {
        logger.warn('no students in draft');
        return fail(497);
      }

      const notifications: Notification[] = [];
      await begin(db, async db => {
        while (true) {
          const draftRound = await incrementDraftRound(db, draftId);
          assert(typeof draftRound !== 'undefined', 'cannot start a non-existent draft');
          logger.debug('draft round incremented', draftRound);

          notifications.push(createDraftRoundStartedNotification(draftId, draftRound.currRound));

          // Pause at the lottery rounds
          if (draftRound.currRound === null) {
            logger.info('lottery round reached');
            break;
          }

          await autoAcknowledgeLabsWithoutPreferences(db, draftId);
          logger.debug('labs without preferences auto-acknowledged');

          const count = await getPendingLabCountInDraft(db, draftId);
          if (count > 0) {
            logger.debug('more pending labs found', { 'lab.pending_count': count });
            break;
          }
        }
      });

      await dispatch.bulkDispatchNotification(...notifications);
      logger.info('draft officially started');
    });
  },
  async intervene({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to intervene draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to intervene draft', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    // TODO: Assert that we are indeed in the lottery phase.

    return await tracer.asyncSpan('action.intervene', async () => {
      const data = await request.formData();
      const draftId = BigInt(validateString(data.get('draft')));
      logger.debug('intervening draft', { 'draft.id': draftId.toString() });
      data.delete('draft');

      const pairs = Array.from(mapRowTuples(data));
      if (pairs.length === 0) {
        logger.debug('no pairs to intervene');
        return;
      }

      logger.debug('intervening draft with pairs', { 'draft.pair_count': pairs.length });
      const result = await insertLotteryChoices(db, draftId, user.id, pairs);
      if (typeof result === 'undefined') {
        logger.error('draft must exist prior to lottery in intervention');
        error(404);
      }

      await dispatch.bulkDispatchNotification(
        ...pairs.map(([studentUserId, labId]) =>
          createDraftLotteryInterventionNotification(draftId, labId, studentUserId),
        ),
      );

      logger.info('draft intervened');
    });
  },
  async conclude({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to conclude draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to conclude draft', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.conclude', async () => {
      const data = await request.formData();
      const draftId = BigInt(validateString(data.get('draft')));
      logger.debug('concluding draft', { 'draft.id': draftId.toString() });

      // TODO: Assert that we are indeed in the lottery phase.

      try {
        const notifications = await begin(db, async db => {
          const notifications: Notification[] = [];

          const labs = await getLabRegistry(db);
          const schedule = Array.from(
            roundrobin(...labs.map(({ id, quota }) => repeat(id, quota))),
          );
          logger.debug('round-robin schedule generated', {
            'draft.schedule.length': schedule.length,
          });

          const studentUserIds = await randomizeRemainingStudents(db, draftId);
          logger.debug('randomized student queue generated', {
            'student.count': studentUserIds.length,
          });

          if (studentUserIds.length !== schedule.length) {
            logger.error('schedule and quota mismatched', void 0, {
              'draft.schedule.length': schedule.length,
              'student.count': studentUserIds.length,
            });
            throw ZIP_NOT_EQUAL;
          }

          const pairs = zip(studentUserIds, schedule);

          if (pairs.length > 0) {
            logger.debug('inserting lottery choices', { 'draft.pair_count': pairs.length });

            const result = await insertLotteryChoices(db, draftId, user.id, pairs);
            if (typeof result === 'undefined') {
              logger.error('draft must exist prior to draft conclusion');
              error(404);
            }

            notifications.push(
              ...pairs.map(([studentUserId, labId]) =>
                createDraftLotteryInterventionNotification(draftId, labId, studentUserId),
              ),
            );
          } else {
            // This only happens if all draft rounds successfully exhausted the student pool.
            logger.debug('no students remaining in the lottery');
          }

          const concluded = await concludeDraft(db, draftId);
          logger.info('draft concluded', { 'draft.concluded_at': concluded.toISOString() });
          notifications.push(createDraftConcludedNotification(draftId));

          const results = await syncResultsToUsers(db, draftId);
          logger.debug('draft results synced', { 'draft.result_count': results.length });
          notifications.push(
            ...results.map(({ userId, labId }) => createUserNotification(userId, labId)),
          );

          return notifications;
        });
        await dispatch.bulkDispatchNotification(...notifications);
      } catch (err) {
        if (err === ZIP_NOT_EQUAL) return fail(403);
        throw err;
      }

      redirect(303, `/history/${draftId}/`);
    });
  },
};
