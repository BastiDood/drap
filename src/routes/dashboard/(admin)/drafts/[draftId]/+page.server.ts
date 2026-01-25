import assert from 'node:assert/strict';

import groupBy from 'just-group-by';
import { error, fail } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';

import {
  autoAcknowledgeLabsWithoutPreferences,
  concludeDraft,
  db,
  getDraftById,
  getFacultyAndStaff,
  getFacultyChoiceRecords,
  getLabById,
  getLabCount,
  getLabRegistry,
  getPendingLabCountInDraft,
  getStudentCountInDraft,
  getStudentsInDraftTaggedByLab,
  getUserById,
  incrementDraftRound,
  insertLotteryChoices,
  isValidTotalLabQuota,
  randomizeRemainingStudents,
  syncResultsToUsers,
} from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateEmail, validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.detail';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access draft detail page without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.warn('insufficient permissions to access draft detail page', {
      'auth.user.is_admin': user.isAdmin,
      'auth.user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const draftId = BigInt(params.draftId);
  const draft = await getDraftById(db, draftId);

  if (typeof draft === 'undefined') {
    logger.warn('draft not found', { 'draft.id': draftId.toString() });
    error(404);
  }

  const [students, records, labs] = await Promise.all([
    getStudentsInDraftTaggedByLab(db, draftId),
    getFacultyChoiceRecords(db, draftId),
    getLabRegistry(db),
  ]);

  const { available = [], selected = [] } = groupBy(students, ({ labId }) =>
    labId === null ? 'available' : 'selected',
  );

  logger.debug('draft detail loaded', {
    'draft.id': draftId.toString(),
    'draft.round.current': draft.currRound,
    'draft.round.max': draft.maxRounds,
    'draft.student.available_count': available.length,
    'draft.student.selected_count': selected.length,
  });

  return {
    draftId,
    draft: { id: draftId, ...draft },
    labs,
    available,
    selected,
    records,
  };
}

function* mapRowTuples(data: FormData) {
  for (const [email, lab] of data.entries()) {
    if (lab instanceof File || lab.length === 0) continue;
    yield [validateEmail(email), lab] as const;
  }
}

const ZIP_NOT_EQUAL = Symbol('ZIP_NOT_EQUAL');

export const actions = {
  async start({ params, locals: { session }, request }) {
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

      // Validate draftId matches URL param
      if (draftId.toString() !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draftId.toString(),
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      logger.debug('starting draft', { 'draft.id': draftId.toString() });

      const labCount = await getLabCount(db);
      assert(labCount > 0);

      const studentCount = await getStudentCountInDraft(db, draftId);
      if (studentCount <= 0) {
        logger.warn('no students in draft');
        return fail(497);
      }

      const roundsToNotify: (number | null)[] = [];
      await db.transaction(
        async db => {
          while (true) {
            const draftRound = await incrementDraftRound(db, draftId);
            assert(typeof draftRound !== 'undefined', 'cannot start a non-existent draft');
            logger.debug('draft round incremented', draftRound);

            roundsToNotify.push(draftRound.currRound);

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
        },
        { isolationLevel: 'repeatable read' },
      );

      // Dispatch notifications for all rounds that were started
      const facultyAndStaff = await getFacultyAndStaff(db);
      await inngest.send(
        roundsToNotify.flatMap(round =>
          facultyAndStaff.map(({ email, givenName, familyName }) => ({
            name: 'draft/round.started' as const,
            data: {
              draftId: Number(draftId),
              round,
              recipientEmail: email,
              recipientName: `${givenName} ${familyName}`,
            },
          })),
        ),
      );
      logger.info('draft officially started');
    });
  },

  async intervene({ params, locals: { session }, request }) {
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

    return await tracer.asyncSpan('action.intervene', async () => {
      const data = await request.formData();
      const draftId = BigInt(validateString(data.get('draft')));

      // Validate draftId matches URL param
      if (draftId.toString() !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draftId.toString(),
          'draft.param_id': params.draftId,
        });
        error(400);
      }

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

      // Dispatch lottery intervention notifications for each pair
      const facultyAndStaff = await getFacultyAndStaff(db);
      for (const [studentUserId, labId] of pairs) {
        const [{ name: labName }, student] = await Promise.all([
          getLabById(db, labId),
          getUserById(db, studentUserId),
        ]);
        await inngest.send(
          facultyAndStaff.map(({ email, givenName, familyName }) => ({
            name: 'draft/lottery.intervened' as const,
            data: {
              draftId: Number(draftId),
              labId,
              labName,
              studentName: `${student.givenName} ${student.familyName}`,
              studentEmail: student.email,
              recipientEmail: email,
              recipientName: `${givenName} ${familyName}`,
            },
          })),
        );
      }

      logger.info('draft intervened');
    });
  },

  async conclude({ params, locals: { session }, request }) {
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

      // Validate draftId matches URL param
      if (draftId.toString() !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draftId.toString(),
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      logger.debug('concluding draft', { 'draft.id': draftId.toString() });

      // Track data needed for notifications after transaction
      let lotteryPairs: (readonly [string, string])[] = [];
      let userAssignments: { userId: string; labId: string }[] = [];

      try {
        await db.transaction(
          async db => {
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

              lotteryPairs = pairs;
            } else {
              // This only happens if all draft rounds successfully exhausted the student pool.
              logger.debug('no students remaining in the lottery');
            }

            const concluded = await concludeDraft(db, draftId);
            logger.info('draft concluded', { 'draft.concluded_at': concluded.toISOString() });

            const results = await syncResultsToUsers(db, draftId);
            logger.debug('draft results synced', { 'draft.result_count': results.length });
            userAssignments = results;
          },
          { isolationLevel: 'repeatable read' },
        );

        // Dispatch notifications after successful transaction
        const facultyAndStaff = await getFacultyAndStaff(db);

        for (const [studentUserId, labId] of lotteryPairs) {
          const [{ name: labName }, student] = await Promise.all([
            getLabById(db, labId),
            getUserById(db, studentUserId),
          ]);
          await inngest.send(
            facultyAndStaff.map(({ email, givenName, familyName }) => ({
              name: 'draft/lottery.intervened' as const,
              data: {
                draftId: Number(draftId),
                labId,
                labName,
                studentName: `${student.givenName} ${student.familyName}`,
                studentEmail: student.email,
                recipientEmail: email,
                recipientName: `${givenName} ${familyName}`,
              },
            })),
          );
        }

        await inngest.send(
          facultyAndStaff.map(({ email, givenName, familyName }) => ({
            name: 'draft/draft.concluded' as const,
            data: {
              draftId: Number(draftId),
              recipientEmail: email,
              recipientName: `${givenName} ${familyName}`,
            },
          })),
        );

        for (const { userId, labId } of userAssignments) {
          const [{ name: labName }, assignedUser] = await Promise.all([
            getLabById(db, labId),
            getUserById(db, userId),
          ]);
          await inngest.send({
            name: 'draft/user.assigned' as const,
            data: {
              labId,
              labName,
              userEmail: assignedUser.email,
              userName: `${assignedUser.givenName} ${assignedUser.familyName}`,
            },
          });
        }
      } catch (err) {
        if (err === ZIP_NOT_EQUAL) return fail(403);
        throw err;
      }
    });
  },
};
