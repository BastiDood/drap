import assert from 'node:assert/strict';

import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, fail } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';

import {
  autoAcknowledgeLabsWithoutPreferences,
  concludeDraft,
  getActiveDraft,
  getDraftAssignmentRecords,
  getDraftById,
  getDraftLabQuotaLabIds,
  getDraftLabQuotaSnapshots,
  getFacultyAndStaff,
  getFacultyChoiceRecords,
  getLabById,
  getPendingLabCountInDraft,
  getStudentCountInDraft,
  getStudentsInDraftTaggedByLab,
  getUserById,
  incrementDraftRound,
  insertLotteryChoices,
  isValidTotalInitialLabQuotaInDraft,
  randomizeRemainingStudents,
  syncResultsToUsers,
  updateDraftInitialLabQuotas,
  updateDraftLotteryLabQuotas,
} from '$lib/server/database/drizzle';
import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const DraftActionFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
});

const QuotaActionFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
  kind: v.union([v.literal('initial'), v.literal('lottery')]),
});

const SERVICE_NAME = 'routes.dashboard.admin.drafts.detail';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access draft detail page without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.error('insufficient permissions to access draft detail page', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('load-draft-detail-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const draft = await getDraftById(db, draftId);

    if (typeof draft === 'undefined') {
      logger.warn('draft not found', { 'draft.id': params.draftId });
      error(404);
    }

    const [students, records, assignments, quotaSnapshots] = await Promise.all([
      getStudentsInDraftTaggedByLab(db, draftId),
      getFacultyChoiceRecords(db, draftId),
      getDraftAssignmentRecords(db, draftId),
      getDraftLabQuotaSnapshots(db, draftId),
    ]);
    const labs = quotaSnapshots.map(({ labId, labName, initialQuota }) => ({
      id: labId,
      name: labName,
      quota: initialQuota,
    }));

    type DraftAssignmentRecords = typeof assignments;
    const regularDrafted: DraftAssignmentRecords = [];
    const interventionDrafted: DraftAssignmentRecords = [];
    const lotteryDrafted: DraftAssignmentRecords = [];

    for (const assignment of assignments)
      if (assignment.round === null) lotteryDrafted.push(assignment);
      else if (assignment.round > 0 && assignment.round <= draft.maxRounds)
        regularDrafted.push(assignment);
      else if (assignment.round === draft.maxRounds + 1) interventionDrafted.push(assignment);

    const regularDraftedIds = new Set(regularDrafted.map(({ id }) => id));
    const undraftedAfterRegular = students.filter(({ id }) => !regularDraftedIds.has(id));

    const { available = [], selected = [] } = Object.groupBy(students, ({ labId }) =>
      labId === null ? 'available' : 'selected',
    );

    let initialQuota = 0;
    let concludedQuota = 0;
    for (const quota of quotaSnapshots) {
      initialQuota += quota.initialQuota;
      concludedQuota += quota.initialQuota + quota.lotteryQuota;
    }

    logger.debug('draft detail loaded', {
      'draft.id': draftId.toString(),
      'draft.round.current': draft.currRound,
      'draft.round.max': draft.maxRounds,
      'draft.student.available_count': available.length,
      'draft.student.selected_count': selected.length,
      'draft.summary.regular_count': regularDrafted.length,
      'draft.summary.intervention_count': interventionDrafted.length,
      'draft.summary.lottery_count': lotteryDrafted.length,
    });

    return {
      draftId,
      draft: { id: draftId, ...draft },
      labs,
      available,
      selected,
      records,
      concluded: {
        quota: {
          initialQuota,
          lotteryInterventions: interventionDrafted.length,
          concludedQuota,
        },
        snapshots: quotaSnapshots.map(row => ({
          ...row,
          concludedQuota: row.initialQuota + row.lotteryQuota,
        })),
        sections: {
          regularDrafted,
          interventionDrafted,
          lotteryDrafted,
          undraftedAfterRegular,
        },
      },
    };
  });
}

const UserId = v.pipe(v.string(), v.ulid());
type UserId = v.InferOutput<typeof UserId>;

function* mapRowTuples(data: FormData) {
  for (const [userId, lab] of data.entries()) {
    if (lab instanceof File || lab.length === 0) continue;
    yield [v.parse(UserId, userId), lab] as [UserId, string];
  }
}

function mapQuotaPairs(data: FormData) {
  const pairs: [string, number][] = [];
  for (const [key, value] of data.entries()) {
    if (key === 'draft' || key === 'kind') continue;
    if (value instanceof File || value.length === 0) continue;
    const quota = Number.parseInt(value, 10);
    if (!Number.isFinite(quota) || quota < 0) error(400);
    pairs.push([key, quota]);
  }
  return pairs;
}

function getUnknownLabIds(labIds: Iterable<string>, knownLabIds: ReadonlySet<string>) {
  const unknown = new Set<string>();
  for (const labId of labIds) if (!knownLabIds.has(labId)) unknown.add(labId);
  return Array.from(unknown);
}

const ZIP_NOT_EQUAL = Symbol('ZIP_NOT_EQUAL');

export const actions = {
  async start({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to start draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to start draft', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.start', async () => {
      const data = await request.formData();
      const { draft } = v.parse(DraftActionFormData, decode(data));

      // Validate draftId matches URL param
      if (draft !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      logger.debug('starting draft', { 'draft.id': draft });

      const draftId = BigInt(draft);
      const isValid = await isValidTotalInitialLabQuotaInDraft(db, draftId);
      if (!isValid) {
        logger.warn('invalid total draft initial quota', { 'draft.id': draftId.toString() });
        return fail(498);
      }

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

  async quota({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to update draft quota snapshots without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to update draft quota snapshots', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.quota', async () => {
      const data = await request.formData();
      const { draft, kind } = v.parse(QuotaActionFormData, decode(data));

      if (draft !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      const draftId = BigInt(draft);
      const activeDraft = await getActiveDraft(db);
      if (typeof activeDraft === 'undefined' || activeDraft.id !== draftId) {
        logger.warn('attempt to update quota snapshots for non-active draft', {
          'draft.id': draftId.toString(),
        });
        error(403);
      }

      const pairs = mapQuotaPairs(data);
      if (pairs.length === 0) {
        logger.debug('no draft quota snapshot updates provided', {
          'draft.id': draftId.toString(),
          'quota.kind': kind,
        });
        return;
      }

      const snapshotLabIds = new Set(await getDraftLabQuotaLabIds(db, draftId));
      const unknownLabIds = getUnknownLabIds(
        pairs.map(([labId]) => labId),
        snapshotLabIds,
      );
      if (unknownLabIds.length > 0) {
        logger.error('attempt to update draft quota snapshots with unknown labs', void 0, {
          'draft.id': draftId.toString(),
          'quota.kind': kind,
          'quota.snapshot_lab_count': snapshotLabIds.size,
          'quota.submitted_lab_count': pairs.length,
          'quota.unknown_lab_count': unknownLabIds.length,
          'quota.unknown_lab_ids': unknownLabIds,
        });
        error(400);
      }

      switch (kind) {
        case 'initial':
          if (activeDraft.currRound !== 0) {
            logger.warn('attempt to update initial snapshots outside registration', {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
            });
            error(403);
          }
          await updateDraftInitialLabQuotas(db, draftId, pairs);
          break;
        case 'lottery':
          if (activeDraft.currRound !== null) {
            logger.warn('attempt to update lottery snapshots outside lottery phase', {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
            });
            error(403);
          }
          await updateDraftLotteryLabQuotas(db, draftId, pairs);
          break;
        default:
          throw new Error(`invalid quota kind: ${kind}`);
      }

      logger.info('draft quota snapshots updated', {
        'draft.id': draftId.toString(),
        'quota.kind': kind,
      });
    });
  },

  async intervene({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to intervene draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to intervene draft', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.intervene', async () => {
      const data = await request.formData();
      const { draft } = v.parse(DraftActionFormData, decode(data));

      // Validate draftId matches URL param
      if (draft !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      logger.debug('intervening draft', { 'draft.id': draft });
      data.delete('draft');

      const pairs = Array.from(mapRowTuples(data));
      if (pairs.length === 0) {
        logger.debug('no pairs to intervene');
        return;
      }

      const draftId = BigInt(draft);
      const snapshotLabIds = new Set(await getDraftLabQuotaLabIds(db, draftId));
      const unknownLabIds = getUnknownLabIds(
        pairs.map(([, labId]) => labId),
        snapshotLabIds,
      );
      if (unknownLabIds.length > 0) {
        logger.error('attempt to intervene draft with unknown labs', void 0, {
          'draft.id': draftId.toString(),
          'draft.pair_count': pairs.length,
          'draft.snapshot_lab_count': snapshotLabIds.size,
          'draft.unknown_lab_count': unknownLabIds.length,
          'draft.unknown_lab_ids': unknownLabIds,
        });
        error(400);
      }

      logger.debug('intervening draft with pairs', { 'draft.pair_count': pairs.length });
      const result = await insertLotteryChoices(db, draftId, user.id, pairs, 'intervention');
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
      logger.error('attempt to conclude draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to conclude draft', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.conclude', async () => {
      const data = await request.formData();
      const { draft } = v.parse(DraftActionFormData, decode(data));

      // Validate draftId matches URL param
      if (draft !== params.draftId) {
        logger.warn('draft id mismatch', {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      logger.debug('concluding draft', { 'draft.id': draft });

      // Track data needed for notifications after transaction
      let lotteryPairs: (readonly [string, string])[] = [];
      let userAssignments: { userId: string; labId: string }[] = [];

      const draftId = BigInt(draft);
      try {
        await db.transaction(
          async db => {
            const snapshots = await getDraftLabQuotaSnapshots(db, draftId);
            const schedule = Array.from(
              roundrobin(
                ...snapshots.map(({ labId, lotteryQuota }) => repeat(labId, lotteryQuota)),
              ),
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

              const result = await insertLotteryChoices(db, draftId, user.id, pairs, 'lottery');
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
