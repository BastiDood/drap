import assert from 'node:assert/strict';

import * as v from 'valibot';
import { and, asc, count, eq, isNotNull, isNull, lt, lte, sql, sum } from 'drizzle-orm';
import { decode } from 'decode-formdata';
import { eachDayOfInterval, startOfDay } from 'date-fns';
import { error, fail } from '@sveltejs/kit';
import { repeat, roundrobin, zip } from 'itertools';

import * as schema from '$lib/server/database/schema';
import { assertDefined, assertOptional, assertSingle } from '$lib/server/assert';
import {
  autoAcknowledgeLabsWithoutPreferences,
  type DbConnection,
  type DrizzleTransaction,
  getDraftAssignmentRecords,
  getDraftById,
  getDraftByIdForUpdate,
  getDraftLabQuotaLabIds,
  getFacultyAndStaff,
  getLabById,
  getPendingLabCountInDraft,
  getUserByEmail,
  incrementDraftRound,
} from '$lib/server/database/drizzle';
import { coerceDate, coerceNullableNumber, coerceNumber } from '$lib/coerce';
import { db } from '$lib/server/database';
import {
  DraftFinalizedBatchEmailEvent,
  LotteryInterventionBatchEmailEvent,
  RoundStartedBatchEmailEvent,
  UserAssignedBatchEmailEvent,
} from '$lib/server/inngest/schema';
import {
  getDraftPhase,
  isInterventionsRendered,
  isLotteryRendered,
} from '$lib/features/drafts/phase';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import {
  buildDraftAssignmentSummary,
  buildDraftSummaryChartData,
  buildLotteryAggregate,
} from './assignment-summary';

const enum AllowlistAddResult {
  NotAStudent = -3,
  UserNotFound = -2,
  AlreadyRegistered = -1,
  AlreadyInAllowlist = 0,
}

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
const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function formatDayLabel(value: Date) {
  return dayFormat.format(value);
}

export async function load({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to access draft detail page without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to access draft detail page', void 0, {
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
      logger.fatal('draft not found', void 0, { 'draft.id': params.draftId });
      error(404);
    }

    const phase = getDraftPhase(draft);
    const needsLotteryRows = isLotteryRendered(phase);
    const needsInterventionsRows = isInterventionsRendered(phase);
    const requestedAt = new Date();

    const {
      studentCount,
      quotaSnapshots,
      allowlistCount,
      lateRegistrantsCount,
      timelineData,
      assignmentCountsByAttribute,
      labDistribution,
      supplyVsDemand,
      preferenceAlignment,
      interventionsAggregate,
      lotteryStatCards,
      lotteryOutcomeRows,
    } = await db.transaction(
      // Needs to be done sequentially because parallel queries in a transaction are not supported.
      async db => {
        const studentCount = await getStudentCountInDraft(db, draftId);
        return {
          studentCount,
          quotaSnapshots: await getDraftLabQuotaSnapshots(db, draftId),
          allowlistCount: await getAllowlistCountByDraft(db, draftId),
          lateRegistrantsCount: await getLateRegistrantsCountByDraft(db, draftId),
          timelineData: await getDraftRegistrationTimeline(
            db,
            draftId,
            draft.activePeriodStart,
            draft.startedAt ?? requestedAt,
          ),
          assignmentCountsByAttribute: await getDraftAssignmentCountsByAttribute(db, draftId),
          labDistribution: await getDraftLabDistribution(db, draftId, studentCount),
          supplyVsDemand: await getDraftSupplyDemand(db, draftId),
          preferenceAlignment: await getDraftPreferenceAlignment(db, draftId),
          interventionsAggregate: needsInterventionsRows
            ? await getInterventionsAggregate(db, draftId, draft.maxRounds, studentCount)
            : {
                statCards: { poolSize: 0, totalLotteryQuota: 0, delta: 0 },
                dumbbellRows: [],
              },
          lotteryStatCards: needsLotteryRows
            ? await getLotteryStatCards(db, draftId)
            : {
                poolSize: 0,
                topChoice: 0,
                rankedLab: 0,
                unranked: 0,
                medianRankHonored: null,
              },
          lotteryOutcomeRows: needsLotteryRows ? await getLotteryOutcomePerLab(db, draftId) : [],
        };
      },
      { isolationLevel: 'repeatable read' },
    );

    const labs = quotaSnapshots.map(({ labId, labName, initialQuota }) => ({
      id: labId,
      name: labName,
      quota: initialQuota,
    }));

    logger.debug('draft detail loaded', {
      'draft.id': draftId.toString(),
      'draft.round.current': draft.currRound,
      'draft.round.max': draft.maxRounds,
    });
    const assignmentSummary = buildDraftAssignmentSummary(
      assignmentCountsByAttribute,
      labs,
      draft.maxRounds,
      studentCount,
    );

    const draftSummaryChartData = buildDraftSummaryChartData(
      labDistribution,
      preferenceAlignment,
      supplyVsDemand,
    );

    const lotteryAggregate = needsLotteryRows
      ? buildLotteryAggregate(lotteryOutcomeRows, lotteryStatCards)
      : {
          statCards: {
            poolSize: 0,
            topChoice: 0,
            rankedLab: 0,
            unranked: 0,
            medianRankHonored: null,
          },
          outcomeStacks: [],
        };

    return {
      draftId,
      draft: { id: draftId, ...draft },
      requestedAt,
      labs,
      studentCount,
      snapshots: quotaSnapshots,
      assignmentSummary,
      draftSummaryChartData,
      allowlistCount,
      lateRegistrantsCount,
      timelineData,
      interventionsAggregate,
      lotteryAggregate,
    };
  });
}

const UserId = v.pipe(v.string(), v.ulid());
type UserId = v.InferOutput<typeof UserId>;

const AllowlistAddFormData = v.object({
  email: v.pipe(v.string(), v.email()),
});

const AllowlistRemoveFormData = v.object({
  studentUserId: UserId,
});

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
    if (!Number.isFinite(quota) || quota < 0) {
      logger.fatal('invalid quota input', void 0, {
        'draft.quota.field': key,
        'draft.quota.value': value,
      });
      error(400);
    }
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

function toRoundStartedPayload(round: number | null, maxRounds: number) {
  return round === null || round > maxRounds ? null : round;
}

export const actions = {
  async start({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to start draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to start draft', void 0, {
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
        logger.fatal('draft id mismatch', void 0, {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      logger.debug('starting draft', { 'draft.id': draft });

      const draftId = BigInt(draft);
      const roundsToNotify: (number | null)[] = [];
      const started = await db.transaction(
        async db => {
          const activeDraft = await getDraftByIdForUpdate(db, draftId);
          if (typeof activeDraft === 'undefined' || activeDraft.activePeriodEnd !== null) {
            logger.fatal('attempt to start non-active draft', void 0, {
              'draft.id': draftId.toString(),
            });
            error(403);
          }

          if (activeDraft.currRound !== 0) {
            logger.fatal('attempt to start draft outside registration phase', void 0, {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
              'draft.round.max': activeDraft.maxRounds,
            });
            error(403);
          }

          const studentCount = await getStudentCountInDraft(db, draftId);
          if (studentCount <= 0) {
            logger.warn('no students in draft');
            return false;
          }

          const { startedAt } = await markDraftAsStarted(db, draftId);
          logger.info('draft officially started', { 'draft.started_at': startedAt.toISOString() });

          while (true) {
            const draftRound = await incrementDraftRound(db, draftId);
            assert(typeof draftRound !== 'undefined', 'cannot start a non-existent draft');
            logger.debug('draft round incremented', draftRound);

            roundsToNotify.push(toRoundStartedPayload(draftRound.currRound, draftRound.maxRounds));

            // Pause at intervention rounds (`maxRounds + 1`).
            if (draftRound.currRound === null || draftRound.currRound > draftRound.maxRounds) {
              logger.info('intervention round reached');
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

          return true;
        },
        { isolationLevel: 'read committed' },
      );

      if (!started) {
        logger.fatal('cannot start draft without students', void 0, {
          'draft.id': draftId.toString(),
        });
        return fail(497);
      }

      // Dispatch notifications for all rounds that were started
      const facultyAndStaff = await getFacultyAndStaff(db);
      await inngest.send(
        roundsToNotify.flatMap(round =>
          facultyAndStaff.map(({ email, givenName, familyName }) =>
            RoundStartedBatchEmailEvent.create({
              draftId: Number(draftId),
              round,
              recipientEmail: email,
              recipientName: `${givenName} ${familyName}`,
            }),
          ),
        ),
      );
      logger.info('draft officially started');
    });
  },

  async quota({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to update draft quota snapshots without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to update draft quota snapshots', void 0, {
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
        logger.fatal('draft id mismatch', void 0, {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      const draftId = BigInt(draft);
      const pairs = mapQuotaPairs(data);
      if (pairs.length === 0) {
        logger.debug('no draft quota snapshot updates provided', {
          'draft.id': draftId.toString(),
          'quota.kind': kind,
        });
        return;
      }

      await db.transaction(
        async db => {
          const activeDraft = await getDraftByIdForUpdate(db, draftId);
          if (typeof activeDraft === 'undefined' || activeDraft.activePeriodEnd !== null) {
            logger.fatal('attempt to update quota snapshots for non-active draft', void 0, {
              'draft.id': draftId.toString(),
            });
            error(403);
          }

          const snapshotLabIds = new Set(await getDraftLabQuotaLabIds(db, draftId));
          const unknownLabIds = getUnknownLabIds(
            pairs.map(([labId]) => labId),
            snapshotLabIds,
          );
          if (unknownLabIds.length > 0) {
            logger.fatal('attempt to update draft quota snapshots with unknown labs', void 0, {
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
                logger.fatal('attempt to update initial snapshots outside registration', void 0, {
                  'draft.id': draftId.toString(),
                  'draft.round.current': activeDraft.currRound,
                });
                error(403);
              }
              await updateDraftInitialLabQuotas(db, draftId, pairs);
              break;
            case 'lottery':
              if (activeDraft.currRound !== activeDraft.maxRounds + 1) {
                logger.fatal(
                  'attempt to update lottery snapshots outside intervention phase',
                  void 0,
                  {
                    'draft.id': draftId.toString(),
                    'draft.round.current': activeDraft.currRound,
                    'draft.round.max': activeDraft.maxRounds,
                  },
                );
                error(403);
              }
              await updateDraftLotteryLabQuotas(db, draftId, pairs);
              break;
            default:
              throw new Error(`invalid quota kind: ${kind}`);
          }
        },
        { isolationLevel: 'read committed' },
      );

      logger.info('draft quota snapshots updated', {
        'draft.id': draftId.toString(),
        'quota.kind': kind,
      });
    });
  },

  async intervene({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to intervene draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to intervene draft', void 0, {
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
        logger.fatal('draft id mismatch', void 0, {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      const draftId = BigInt(draft);
      logger.debug('intervening draft', { 'draft.id': draft });
      data.delete('draft');

      const pairs = Array.from(mapRowTuples(data));
      if (pairs.length === 0) {
        logger.debug('no pairs to intervene');
        return;
      }

      logger.debug('intervening draft with pairs', { 'draft.pair_count': pairs.length });
      const result = await db.transaction(
        async db => {
          const activeDraft = await getDraftByIdForUpdate(db, draftId);

          if (typeof activeDraft === 'undefined' || activeDraft.activePeriodEnd !== null) {
            logger.fatal('attempt to intervene non-active draft', void 0, {
              'draft.id': draftId.toString(),
            });
            error(403);
          }

          if (activeDraft.currRound !== activeDraft.maxRounds + 1) {
            logger.fatal('attempt to intervene outside intervention rounds', void 0, {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
              'draft.round.max': activeDraft.maxRounds,
            });
            error(403);
          }

          const snapshotLabIds = new Set(await getDraftLabQuotaLabIds(db, draftId));
          const unknownLabIds = getUnknownLabIds(
            pairs.map(([, labId]) => labId),
            snapshotLabIds,
          );
          if (unknownLabIds.length > 0) {
            logger.fatal('attempt to intervene draft with unknown labs', void 0, {
              'draft.id': draftId.toString(),
              'draft.pair_count': pairs.length,
              'draft.snapshot_lab_count': snapshotLabIds.size,
              'draft.unknown_lab_count': unknownLabIds.length,
              'draft.unknown_lab_ids': unknownLabIds,
            });
            error(400);
          }

          return await insertLotteryChoices(db, draftId, user.id, pairs, 'intervention');
        },
        { isolationLevel: 'read committed' },
      );

      if (typeof result === 'undefined') {
        logger.fatal('draft must exist prior to lottery in intervention');
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
          facultyAndStaff.map(({ email, givenName, familyName }) =>
            LotteryInterventionBatchEmailEvent.create({
              draftId: Number(draftId),
              labId,
              labName,
              studentName: `${student.givenName} ${student.familyName}`,
              studentEmail: student.email,
              avatarUrl: student.avatarUrl,
              recipientEmail: email,
              recipientName: `${givenName} ${familyName}`,
            }),
          ),
        );
      }

      logger.info('draft intervened');
    });
  },

  async conclude({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to conclude draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to conclude draft', void 0, {
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
        logger.fatal('draft id mismatch', void 0, {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      const draftId = BigInt(draft);
      logger.debug('running lottery and entering review', { 'draft.id': draft });

      try {
        await db.transaction(
          async db => {
            const activeDraft = await getDraftByIdForUpdate(db, draftId);
            if (typeof activeDraft === 'undefined' || activeDraft.activePeriodEnd !== null) {
              logger.fatal('attempt to conclude non-active draft', void 0, {
                'draft.id': draftId.toString(),
              });
              error(403);
            }

            if (activeDraft.currRound !== activeDraft.maxRounds + 1) {
              logger.fatal('attempt to conclude outside intervention rounds', void 0, {
                'draft.id': draftId.toString(),
                'draft.round.current': activeDraft.currRound,
                'draft.round.max': activeDraft.maxRounds,
              });
              error(403);
            }

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
                logger.fatal('draft must exist prior to draft finalization');
                error(404);
              }
            } else {
              // This only happens if all draft rounds successfully exhausted the student pool.
              logger.debug('no students remaining in the lottery');
            }

            const review = await beginDraftReview(db, draftId);
            if (typeof review === 'undefined') {
              logger.fatal('draft must exist prior to entering review');
              error(404);
            }
          },
          { isolationLevel: 'read committed' },
        );
        logger.info('draft review started');
      } catch (err) {
        if (err === ZIP_NOT_EQUAL) {
          logger.fatal('cannot conclude draft because schedule and quota mismatched');
          return fail(403);
        }
        throw err;
      }
    });
  },

  async finalize({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to finalize draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to finalize draft', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.finalize', async () => {
      const data = await request.formData();
      const { draft } = v.parse(DraftActionFormData, decode(data));

      if (draft !== params.draftId) {
        logger.fatal('draft id mismatch', void 0, {
          'draft.form_id': draft,
          'draft.param_id': params.draftId,
        });
        error(400);
      }

      const draftId = BigInt(draft);
      logger.debug('finalizing draft', { 'draft.id': draft });

      let userAssignments: { userId: string; labId: string }[] = [];
      await db.transaction(
        async db => {
          const activeDraft = await getDraftByIdForUpdate(db, draftId);

          if (typeof activeDraft === 'undefined' || activeDraft.activePeriodEnd !== null) {
            logger.fatal('attempt to finalize non-active draft', void 0, {
              'draft.id': draftId.toString(),
            });
            error(403);
          }

          if (activeDraft.currRound !== null) {
            logger.fatal('attempt to finalize outside review phase', void 0, {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
              'draft.round.max': activeDraft.maxRounds,
            });
            error(403);
          }

          const finalizedAt = await concludeDraft(db, draftId);
          logger.info('draft finalized and closed', {
            'draft.finalized_at': finalizedAt.toISOString(),
          });

          const results = await syncResultsToUsers(db, draftId);
          logger.debug('draft results synced', { 'draft.result_count': results.length });
          userAssignments = results;
        },
        { isolationLevel: 'read committed' },
      );

      const [facultyAndStaff, assignments] = await Promise.all([
        getFacultyAndStaff(db),
        getDraftAssignmentRecords(db, draftId),
      ]);

      const lotteryAssignments = assignments
        .filter(({ round }) => round === null)
        .map(({ labId, labName, givenName, familyName, email, avatarUrl }) => ({
          labId,
          labName,
          studentName: `${givenName} ${familyName}`,
          studentEmail: email,
          avatarUrl,
        }));

      await inngest.send(
        facultyAndStaff.map(({ email, givenName, familyName }) =>
          DraftFinalizedBatchEmailEvent.create({
            draftId: Number(draftId),
            recipientEmail: email,
            recipientName: `${givenName} ${familyName}`,
            lotteryAssignments,
          }),
        ),
      );

      for (const { userId, labId } of userAssignments) {
        const [{ name: labName }, assignedUser] = await Promise.all([
          getLabById(db, labId),
          getUserById(db, userId),
        ]);
        await inngest.send(
          UserAssignedBatchEmailEvent.create({
            labId,
            labName,
            userEmail: assignedUser.email,
            userName: `${assignedUser.givenName} ${assignedUser.familyName}`,
          }),
        );
      }
    });
  },

  async 'add-to-allowlist'({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to add to allowlist without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('invalid user', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.allowlist-add', async () => {
      const data = await request.formData();
      const payload = decode(data);

      // eslint-disable-next-line @typescript-eslint/init-declarations
      let parsed: v.InferOutput<typeof AllowlistAddFormData>;
      try {
        parsed = v.parse(AllowlistAddFormData, payload);
      } catch (err) {
        if (v.isValiError(err)) {
          logger.fatal('Invalid email address', err);
          return fail(400, { message: 'Invalid email address.' });
        }
        throw err;
      }

      if (parsed === null) {
        logger.fatal('Invalid email address');
        return fail(400, { message: 'Invalid email address.' });
      }
      const { email } = parsed;

      const draftId = BigInt(params.draftId);

      const result = await db.transaction(
        async db => {
          const draft = await getDraftByIdForUpdate(db, draftId);
          if (typeof draft === 'undefined') {
            logger.fatal('draft not found', void 0, { 'draft.id': draftId.toString() });
            error(404);
          }

          if (draft.currRound !== 0) {
            logger.fatal('draft already started', void 0, { 'draft.id': draftId.toString() });
            error(403);
          }

          const targetUser = await getUserByEmail(db, email);
          if (typeof targetUser === 'undefined') return AllowlistAddResult.UserNotFound;
          if (targetUser.isAdmin || targetUser.studentNumber === null)
            return AllowlistAddResult.NotAStudent;

          // Check if targetUser is already registered or already has a lab
          const isRegisteredOrAssigned = await isRegisteredOrAssignedInDraft(
            db,
            draftId,
            targetUser.id,
          );
          if (isRegisteredOrAssigned) return AllowlistAddResult.AlreadyRegistered;

          return await addToAllowlist(db, draftId, targetUser.id, user.id);
        },
        { isolationLevel: 'read committed' },
      );

      switch (result) {
        case AllowlistAddResult.UserNotFound:
          logger.fatal('user with this email not found', void 0, {
            'draft.id': draftId.toString(),
          });
          return fail(400, { status: 'user-not-found' as const });
        case AllowlistAddResult.AlreadyRegistered:
          logger.fatal('user already registered', void 0, { 'draft.id': draftId.toString() });
          return fail(409, { status: 'already-registered' as const });
        case AllowlistAddResult.AlreadyInAllowlist:
          logger.fatal('user already in allowlist', void 0, { 'draft.id': draftId.toString() });
          return fail(409, { status: 'already-in-allowlist' as const });
        case AllowlistAddResult.NotAStudent:
          logger.fatal('user is not a student', void 0, { 'draft.id': draftId.toString() });
          return fail(400, { status: 'not-a-student' as const });
        default:
          logger.info('student added to allowlist', {
            'draft.id': params.draftId,
            email,
            'admin.id': user.id,
          });
          break;
      }
    });
  },

  async 'remove-from-allowlist'({ params, locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to remove from allowlist without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('invalid user', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.allowlist-remove', async () => {
      const data = await request.formData();
      const payload = decode(data);

      // eslint-disable-next-line @typescript-eslint/init-declarations
      let parsed: v.InferOutput<typeof AllowlistRemoveFormData>;
      try {
        parsed = v.parse(AllowlistRemoveFormData, payload);
      } catch (err) {
        if (v.isValiError(err)) {
          logger.fatal('invalid  student user ID', err);
          return fail(400, { message: 'Invalid student user ID.' });
        }
        throw err;
      }

      if (parsed === null) {
        logger.fatal('invalid  student user ID');
        return fail(400, { message: 'Invalid student user ID.' });
      }
      const { studentUserId } = parsed;
      const draftId = BigInt(params.draftId);

      await db.transaction(
        async db => {
          const draft = await getDraftByIdForUpdate(db, draftId);
          if (typeof draft === 'undefined') {
            logger.fatal('draft not found', void 0, { 'draft.id': draftId.toString() });
            error(404);
          }

          if (draft.currRound !== 0) {
            logger.fatal('draft already started', void 0, { 'draft.id': draftId.toString() });
            error(403);
          }

          await removeFromAllowlist(db, draftId, studentUserId);
        },
        { isolationLevel: 'read committed' },
      );

      logger.info('student removed from allowlist', {
        'draft.id': params.draftId,
        studentUserId,
        'admin.id': user.id,
      });
    });
  },
};

async function getUserById(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('get-user-by-id', async span => {
    span.setAttribute('database.user.id', userId);
    return await db.query.user
      .findFirst({
        columns: { email: true, avatarUrl: true, givenName: true, familyName: true },
        where: ({ id }, { eq }) => eq(id, userId),
      })
      .then(assertDefined);
  });
}

async function getDraftLabQuotaSnapshots(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-lab-quota-snapshots', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        labId: schema.draftLabQuota.labId,
        labName: schema.lab.name,
        initialQuota: schema.draftLabQuota.initialQuota,
        lotteryQuota: schema.draftLabQuota.lotteryQuota,
      })
      .from(schema.draftLabQuota)
      .innerJoin(schema.lab, eq(schema.draftLabQuota.labId, schema.lab.id))
      .where(eq(schema.draftLabQuota.draftId, draftId))
      .orderBy(asc(schema.lab.name));
  });
}

async function getStudentCountInDraft(db: DbConnection, id: bigint) {
  return await tracer.asyncSpan('get-student-count-in-draft', async span => {
    span.setAttribute('database.draft.id', id.toString());
    const { result } = await db
      .select({ result: count(schema.studentRank.userId) })
      .from(schema.studentRank)
      .where(eq(schema.studentRank.draftId, id))
      .then(assertSingle);
    return result;
  });
}

async function updateDraftInitialLabQuotas(
  db: DbConnection,
  draftId: bigint,
  quotas: Iterable<readonly [string, number]>,
) {
  return await tracer.asyncSpan('update-draft-initial-lab-quotas', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const values = Array.from(
      quotas,
      ([labId, initialQuota]): Pick<
        schema.NewDraftLabQuota,
        'draftId' | 'labId' | 'initialQuota'
      > => ({
        draftId,
        labId,
        initialQuota,
      }),
    );
    if (values.length === 0) return;

    await db
      .insert(schema.draftLabQuota)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.draftLabQuota.draftId, schema.draftLabQuota.labId],
        set: {
          initialQuota: sql`excluded.${sql.raw(schema.draftLabQuota.initialQuota.name)}`,
          updatedAt: sql`now()`,
        },
      });
  });
}

async function updateDraftLotteryLabQuotas(
  db: DbConnection,
  draftId: bigint,
  quotas: Iterable<readonly [string, number]>,
) {
  return await tracer.asyncSpan('update-draft-lottery-lab-quotas', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const values = Array.from(
      quotas,
      ([labId, lotteryQuota]): Pick<
        schema.NewDraftLabQuota,
        'draftId' | 'labId' | 'lotteryQuota'
      > => ({
        draftId,
        labId,
        lotteryQuota,
      }),
    );
    if (values.length === 0) return;

    await db
      .insert(schema.draftLabQuota)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.draftLabQuota.draftId, schema.draftLabQuota.labId],
        set: {
          lotteryQuota: sql`excluded.${sql.raw(schema.draftLabQuota.lotteryQuota.name)}`,
          updatedAt: sql`now()`,
        },
      });
  });
}

async function markDraftAsStarted(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('mark-draft-as-started', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .update(schema.draft)
      .set({ startedAt: sql`now()` })
      .where(eq(schema.draft.id, draftId))
      .returning({ startedAt: sql`${schema.draft.startedAt}`.mapWith(coerceDate) })
      .then(assertSingle);
  });
}

async function randomizeRemainingStudents(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('randomize-remaining-students', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const results = await db
      .select({ userId: schema.studentRank.userId })
      .from(schema.studentRank)
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.studentRank.draftId, schema.facultyChoiceUser.draftId),
          eq(schema.studentRank.userId, schema.facultyChoiceUser.studentUserId),
        ),
      )
      .where(
        and(
          eq(schema.studentRank.draftId, draftId),
          isNull(schema.facultyChoiceUser.studentUserId),
        ),
      )
      .orderBy(sql`random()`);
    return results.map(({ userId }) => userId);
  });
}

async function concludeDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('conclude-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const { activePeriodEnd } = await db
      .update(schema.draft)
      .set({
        activePeriod: sql`tstzrange(lower(${schema.draft.activePeriod}), coalesce(upper(${schema.draft.activePeriod}), now()), '[)')`,
      })
      .where(eq(schema.draft.id, draftId))
      .returning({ activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate) })
      .then(assertSingle);
    return activePeriodEnd;
  });
}

async function beginDraftReview(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('begin-draft-review', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .update(schema.draft)
      .set({ currRound: null })
      .where(eq(schema.draft.id, draftId))
      .returning({ maxRounds: schema.draft.maxRounds })
      .then(assertOptional);
  });
}

async function getAllowlistCountByDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-allowlist-count-by-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const { result } = await db
      .select({ result: count(schema.draftRegistrationAllowlist.studentUserId) })
      .from(schema.draftRegistrationAllowlist)
      .where(eq(schema.draftRegistrationAllowlist.draftId, draftId))
      .then(assertSingle);
    return result;
  });
}

async function addToAllowlist(
  db: DrizzleTransaction,
  draftId: bigint,
  studentUserId: string,
  adminUserId: string,
) {
  return await tracer.asyncSpan('add-to-allowlist', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.user.student_id': studentUserId,
      'database.user.admin_id': adminUserId,
    });
    const result = await db
      .insert(schema.draftRegistrationAllowlist)
      .values({ draftId, studentUserId, adminUserId })
      .onConflictDoNothing({
        target: [
          schema.draftRegistrationAllowlist.draftId,
          schema.draftRegistrationAllowlist.studentUserId,
        ],
      });
    assert(result.rowCount !== null);
    logger.debug('added to allowlist', { rowCount: result.rowCount });
    return result.rowCount;
  });
}

async function removeFromAllowlist(db: DrizzleTransaction, draftId: bigint, studentUserId: string) {
  return await tracer.asyncSpan('remove-from-allowlist', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.user.id': studentUserId,
    });
    return await db
      .delete(schema.draftRegistrationAllowlist)
      .where(
        and(
          eq(schema.draftRegistrationAllowlist.draftId, draftId),
          eq(schema.draftRegistrationAllowlist.studentUserId, studentUserId),
        ),
      );
  });
}

async function isRegisteredOrAssignedInDraft(
  db: DrizzleTransaction,
  draftId: bigint,
  userId: string,
) {
  return await tracer.asyncSpan('is-registered-or-assigned-in-draft', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.user.id': userId,
    });

    const registeredResult = await db
      .select({ userId: schema.studentRank.userId })
      .from(schema.studentRank)
      .innerJoin(schema.user, eq(schema.studentRank.userId, schema.user.id))
      .where(and(eq(schema.studentRank.draftId, draftId), eq(schema.user.id, userId)))
      .then(assertOptional);

    if (typeof registeredResult !== 'undefined') {
      logger.debug('registered', { 'student_rank.user_id': registeredResult.userId });
      return true;
    }

    const assignedResult = await db
      .select({ studentUserId: schema.facultyChoiceUser.studentUserId })
      .from(schema.facultyChoiceUser)
      .innerJoin(schema.user, eq(schema.facultyChoiceUser.studentUserId, schema.user.id))
      .where(and(eq(schema.facultyChoiceUser.draftId, draftId), eq(schema.user.id, userId)))
      .then(assertOptional);

    if (typeof assignedResult !== 'undefined') {
      logger.debug('assigned', { 'faculty_choice.student_user_id': assignedResult.studentUserId });
      return true;
    }

    logger.debug('not registered or assigned');
    return false;
  });
}

async function getLateRegistrantsCountByDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-late-registrants-count-by-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const { result } = await db
      .select({ result: count(schema.studentRank.userId) })
      .from(schema.studentRank)
      .innerJoin(schema.draft, eq(schema.studentRank.draftId, schema.draft.id))
      .where(
        and(
          eq(schema.studentRank.draftId, draftId),
          lt(schema.draft.registrationClosedAt, schema.studentRank.createdAt),
        ),
      )
      .then(assertSingle);
    return result;
  });
}

async function getDraftRegistrationTimeline(
  db: DbConnection,
  id: bigint,
  draftCreatedAt: Date,
  chartEnd: Date,
) {
  return await tracer.asyncSpan('get-draft-registration-timeline', async span => {
    span.setAttribute('database.draft.id', id.toString());
    const rows = await db
      .select({
        date: sql`date_trunc('day', ${schema.studentRank.createdAt})`.mapWith(coerceDate),
        count: count(schema.studentRank.userId),
      })
      .from(schema.studentRank)
      .where(eq(schema.studentRank.draftId, id))
      .groupBy(({ date }) => date)
      .orderBy(({ date }) => date);

    const countByDay = new Map(rows.map(({ date, count }) => [startOfDay(date).getTime(), count]));
    return eachDayOfInterval({
      start: startOfDay(draftCreatedAt),
      end: startOfDay(chartEnd),
    }).map(date => ({
      date,
      label: formatDayLabel(date),
      count: countByDay.get(date.getTime()) ?? 0,
    }));
  });
}

async function getDraftPreferenceAlignment(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-preference-alignment', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const studentLabCount = db.$with('student_lab_count').as(
      db
        .select({
          draftId: schema.studentRankLab.draftId,
          userId: schema.studentRankLab.userId,
          n: count().as('n'),
        })
        .from(schema.studentRankLab)
        .where(eq(schema.studentRankLab.draftId, draftId))
        .groupBy(({ draftId, userId }) => [draftId, userId]),
    );
    const alignmentBase = db.$with('alignment_base').as(
      db
        .with(studentLabCount)
        .select({
          preferenceRank: sql`${schema.studentRankLab.index}::integer`
            .mapWith(coerceNullableNumber)
            .as('preference_rank'),
          satisfaction: sql`case
            when ${schema.studentRankLab.index} is null or ${studentLabCount.n} is null then 0::double precision
            when ${studentLabCount.n} = 1 then 1::double precision
            else (${studentLabCount.n} - ${schema.studentRankLab.index})::double precision / (${studentLabCount.n} - 1)
          end`.as('satisfaction'),
        })
        .from(schema.facultyChoiceUser)
        .leftJoin(
          schema.studentRankLab,
          and(
            eq(schema.facultyChoiceUser.draftId, schema.studentRankLab.draftId),
            eq(schema.facultyChoiceUser.studentUserId, schema.studentRankLab.userId),
            eq(schema.facultyChoiceUser.labId, schema.studentRankLab.labId),
          ),
        )
        .leftJoin(
          studentLabCount,
          and(
            eq(schema.facultyChoiceUser.draftId, studentLabCount.draftId),
            eq(schema.facultyChoiceUser.studentUserId, studentLabCount.userId),
          ),
        )
        .where(eq(schema.facultyChoiceUser.draftId, draftId)),
    );

    const rows = await db
      .with(studentLabCount, alignmentBase)
      .select({
        preferenceRank: alignmentBase.preferenceRank,
        count: count(),
        bordaScore: sql`coalesce(
          sum(sum(${alignmentBase.satisfaction})) over () /
          nullif(sum(count(*)) over (), 0),
          0
        )`.mapWith(coerceNumber),
      })
      .from(alignmentBase)
      .groupBy(({ preferenceRank }) => preferenceRank)
      .orderBy(sql`${alignmentBase.preferenceRank} nulls last`);

    return {
      rows: rows.map(({ preferenceRank, count }) => ({ preferenceRank, count })),
      bordaScore: rows[0]?.bordaScore ?? 0,
    };
  });
}

async function getDraftLabDistribution(db: DbConnection, draftId: bigint, totalStudents: number) {
  return await tracer.asyncSpan('get-draft-lab-distribution', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const rows = await db
      .select({
        labId: schema.facultyChoiceUser.labId,
        labName: schema.lab.name,
        count: count(schema.facultyChoiceUser.studentUserId),
      })
      .from(schema.facultyChoiceUser)
      .innerJoin(schema.lab, eq(schema.facultyChoiceUser.labId, schema.lab.id))
      .where(eq(schema.facultyChoiceUser.draftId, draftId))
      .groupBy(({ labId, labName }) => [labId, labName])
      .orderBy(({ labName }) => labName);

    const totalAssigned = rows.reduce((total, row) => total + row.count, 0);
    const unassigned = totalStudents - totalAssigned;
    if (unassigned <= 0) return rows;
    return [...rows, { labId: null, labName: 'Unassigned', count: unassigned }];
  });
}

async function getDraftSupplyDemand(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-supply-demand', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const actualByLab = db.$with('actual_by_lab').as(
      db
        .select({
          labId: schema.facultyChoiceUser.labId,
          actual: count(schema.facultyChoiceUser.studentUserId).as('actual'),
        })
        .from(schema.facultyChoiceUser)
        .where(eq(schema.facultyChoiceUser.draftId, draftId))
        .groupBy(({ labId }) => labId),
    );
    const studentLabCount = db.$with('student_lab_count').as(
      db
        .select({
          draftId: schema.studentRankLab.draftId,
          userId: schema.studentRankLab.userId,
          n: count().as('n'),
        })
        .from(schema.studentRankLab)
        .where(eq(schema.studentRankLab.draftId, draftId))
        .groupBy(({ draftId, userId }) => [draftId, userId]),
    );
    const demandByLab = db.$with('demand_by_lab').as(
      db
        .with(studentLabCount)
        .select({
          labId: schema.studentRankLab.labId,
          bordaScore: sum(sql`${studentLabCount.n} - ${schema.studentRankLab.index} + 1`).as(
            'borda_score',
          ),
        })
        .from(schema.studentRankLab)
        .innerJoin(
          studentLabCount,
          and(
            eq(schema.studentRankLab.draftId, studentLabCount.draftId),
            eq(schema.studentRankLab.userId, studentLabCount.userId),
          ),
        )
        .where(eq(schema.studentRankLab.draftId, draftId))
        .groupBy(({ labId }) => labId),
    );

    return await db
      .with(actualByLab, studentLabCount, demandByLab)
      .select({
        labId: schema.draftLabQuota.labId,
        labName: schema.lab.name,
        supplyShare: sql`case
          when sum(${schema.draftLabQuota.initialQuota}) over () = 0 then 0
          else ${schema.draftLabQuota.initialQuota}::double precision /
            sum(${schema.draftLabQuota.initialQuota}) over ()
        end`.mapWith(coerceNumber),
        demandShare: sql`case
          when sum(coalesce(${demandByLab.bordaScore}, 0)) over () = 0 then 0
          else coalesce(${demandByLab.bordaScore}, 0)::double precision /
            sum(coalesce(${demandByLab.bordaScore}, 0)) over ()
        end`.mapWith(coerceNumber),
        actualShare: sql`case
          when sum(coalesce(${actualByLab.actual}, 0)) over () = 0 then 0
          else coalesce(${actualByLab.actual}, 0)::double precision /
            sum(coalesce(${actualByLab.actual}, 0)) over ()
        end`.mapWith(coerceNumber),
      })
      .from(schema.draftLabQuota)
      .innerJoin(schema.lab, eq(schema.draftLabQuota.labId, schema.lab.id))
      .leftJoin(actualByLab, eq(schema.draftLabQuota.labId, actualByLab.labId))
      .leftJoin(demandByLab, eq(schema.draftLabQuota.labId, demandByLab.labId))
      .where(eq(schema.draftLabQuota.draftId, draftId))
      .orderBy(({ labName }) => labName);
  });
}

async function getLotteryOutcomePerLab(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-lottery-outcome-per-lab', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        labId: schema.facultyChoiceUser.labId,
        labName: schema.lab.name,
        preferenceRank: schema.studentRankLab.index,
        count: count(),
      })
      .from(schema.facultyChoiceUser)
      .innerJoin(schema.lab, eq(schema.facultyChoiceUser.labId, schema.lab.id))
      .leftJoin(
        schema.studentRankLab,
        and(
          eq(schema.facultyChoiceUser.draftId, schema.studentRankLab.draftId),
          eq(schema.facultyChoiceUser.studentUserId, schema.studentRankLab.userId),
          eq(schema.facultyChoiceUser.labId, schema.studentRankLab.labId),
        ),
      )
      .where(
        and(eq(schema.facultyChoiceUser.draftId, draftId), isNull(schema.facultyChoiceUser.round)),
      )
      .groupBy(({ labId, labName, preferenceRank }) => [labId, labName, preferenceRank])
      .orderBy(({ labName, preferenceRank }) => [labName, preferenceRank]);
  });
}

async function getLotteryStatCards(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-lottery-stat-cards', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        poolSize: count(schema.facultyChoiceUser.studentUserId),
        topChoice:
          sql`coalesce(sum(case when ${schema.studentRankLab.index} = 1 then 1 else 0 end), 0)`.mapWith(
            coerceNumber,
          ),
        rankedLab: count(schema.studentRankLab.index),
        unranked:
          sql`coalesce(sum(case when ${schema.studentRankLab.index} is null then 1 else 0 end), 0)`.mapWith(
            coerceNumber,
          ),
        medianRankHonored:
          sql`(percentile_disc(0.5) within group (order by ${schema.studentRankLab.index}) filter (where ${schema.studentRankLab.index} is not null))::integer`.mapWith(
            coerceNullableNumber,
          ),
      })
      .from(schema.facultyChoiceUser)
      .leftJoin(
        schema.studentRankLab,
        and(
          eq(schema.facultyChoiceUser.draftId, schema.studentRankLab.draftId),
          eq(schema.facultyChoiceUser.studentUserId, schema.studentRankLab.userId),
          eq(schema.facultyChoiceUser.labId, schema.studentRankLab.labId),
        ),
      )
      .where(
        and(eq(schema.facultyChoiceUser.draftId, draftId), isNull(schema.facultyChoiceUser.round)),
      )
      .then(assertSingle);
  });
}

async function getInterventionsAggregate(
  db: DbConnection,
  draftId: bigint,
  maxRounds: number,
  totalStudents: number,
) {
  return await tracer.asyncSpan('get-interventions-aggregate', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const regularAssignedByLab = db.$with('regular_assigned_by_lab').as(
      db
        .select({
          labId: schema.facultyChoiceUser.labId,
          regularAssigned: count(schema.facultyChoiceUser.studentUserId).as('regular_assigned'),
        })
        .from(schema.facultyChoiceUser)
        .where(
          and(
            eq(schema.facultyChoiceUser.draftId, draftId),
            isNotNull(schema.facultyChoiceUser.round),
            lte(schema.facultyChoiceUser.round, maxRounds),
          ),
        )
        .groupBy(({ labId }) => labId),
    );
    const nonLotteryAssigned = db.$with('non_lottery_assigned').as(
      db
        .select({
          nonLotteryAssigned: count(schema.facultyChoiceUser.studentUserId).as(
            'non_lottery_assigned',
          ),
        })
        .from(schema.facultyChoiceUser)
        .where(
          and(
            eq(schema.facultyChoiceUser.draftId, draftId),
            isNotNull(schema.facultyChoiceUser.round),
          ),
        ),
    );
    const regularVacancies = sql`greatest(${schema.draftLabQuota.initialQuota} - coalesce(${regularAssignedByLab.regularAssigned}, 0), 0)`;
    const poolSize = sql`greatest(${totalStudents} - coalesce(${nonLotteryAssigned.nonLotteryAssigned}, 0), 0)`;
    const totalLotteryQuota = sql`sum(${schema.draftLabQuota.lotteryQuota}) over ()`;
    const gap = sql`${schema.draftLabQuota.lotteryQuota} - ${regularVacancies}`;

    const rows = await db
      .with(regularAssignedByLab, nonLotteryAssigned)
      .select({
        poolSize: poolSize.mapWith(coerceNumber),
        totalLotteryQuota: totalLotteryQuota.mapWith(coerceNumber),
        delta: sql`${poolSize} - ${totalLotteryQuota}`.mapWith(coerceNumber),
        labId: schema.draftLabQuota.labId,
        labName: schema.lab.name,
        naturalLeftover: regularVacancies.mapWith(coerceNumber),
        lotteryQuota: schema.draftLabQuota.lotteryQuota,
        gap: gap.mapWith(coerceNumber),
      })
      .from(schema.draftLabQuota)
      .innerJoin(schema.lab, eq(schema.draftLabQuota.labId, schema.lab.id))
      .leftJoin(regularAssignedByLab, eq(schema.draftLabQuota.labId, regularAssignedByLab.labId))
      .leftJoin(nonLotteryAssigned, sql`true`)
      .where(eq(schema.draftLabQuota.draftId, draftId))
      .orderBy(sql`abs(${gap}) desc`, asc(schema.lab.name));

    return {
      statCards: {
        poolSize: rows[0]?.poolSize ?? 0,
        totalLotteryQuota: rows[0]?.totalLotteryQuota ?? 0,
        delta: rows[0]?.delta ?? 0,
      },
      dumbbellRows: rows.map(({ labId, labName, naturalLeftover, lotteryQuota, gap }) => ({
        labId,
        labName,
        naturalLeftover,
        lotteryQuota,
        gap,
      })),
    };
  });
}

async function insertLotteryChoices(
  db: DrizzleTransaction,
  draftId: bigint,
  adminUserId: string,
  assignmentUserIdToLabPairs: (readonly [string, string])[],
  mode: 'intervention' | 'lottery',
) {
  return await tracer.asyncSpan('insert-lottery-choices', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.user.admin_id': adminUserId,
      'database.choice.mode': mode,
    });
    const draft = await db.query.draft.findFirst({
      columns: { maxRounds: true },
      where: ({ id }, { eq }) => eq(id, draftId),
    });
    if (typeof draft === 'undefined') return;

    const labs = await db
      .select({ id: schema.draftLabQuota.labId })
      .from(schema.draftLabQuota)
      .where(eq(schema.draftLabQuota.draftId, draftId));
    if (labs.length === 0) return;

    const round = mode === 'intervention' ? draft.maxRounds + 1 : null;
    await db
      .insert(schema.facultyChoice)
      .values(
        labs.map(
          ({ id }) =>
            ({
              draftId,
              round,
              labId: id,
              userId: adminUserId,
            }) satisfies schema.NewFacultyChoice,
        ),
      )
      .onConflictDoUpdate({
        target: [
          schema.facultyChoice.draftId,
          schema.facultyChoice.round,
          schema.facultyChoice.labId,
        ],
        set: { userId: sql`excluded.${sql.raw(schema.facultyChoice.userId.name)}` },
      });

    if (assignmentUserIdToLabPairs.length > 0) {
      const facultyUserId = mode === 'intervention' ? adminUserId : null;
      await db.insert(schema.facultyChoiceUser).values(
        assignmentUserIdToLabPairs.map(
          ([studentUserId, labId]): schema.NewFacultyChoiceUser => ({
            facultyUserId,
            studentUserId,
            draftId,
            round,
            labId,
          }),
        ),
      );
    }

    return draft;
  });
}

async function syncResultsToUsers(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('sync-results-to-users', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .update(schema.user)
      .set({ labId: schema.facultyChoiceUser.labId })
      .from(schema.facultyChoiceUser)
      .where(
        and(
          eq(schema.facultyChoiceUser.draftId, draftId),
          eq(schema.user.id, schema.facultyChoiceUser.studentUserId),
        ),
      )
      .returning({ userId: schema.user.id, labId: schema.facultyChoiceUser.labId });
  });
}

async function getDraftAssignmentCountsByAttribute(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-assignment-counts-by-lab', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        labId: schema.facultyChoiceUser.labId,
        round: schema.facultyChoiceUser.round,
        count: count(schema.facultyChoiceUser.studentUserId),
      })
      .from(schema.facultyChoiceUser)
      .where(eq(schema.facultyChoiceUser.draftId, draftId))
      .groupBy(({ labId, round }) => [labId, round]);
  });
}
