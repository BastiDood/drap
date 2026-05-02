import assert, { strictEqual } from 'node:assert/strict';

import * as v from 'valibot';
import {
  and,
  count,
  countDistinct,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { decode } from 'decode-formdata';
import { error, fail, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertOptional, assertSingle } from '$lib/server/assert';
import {
  autoAcknowledgeLabsWithoutPreferences,
  type DbConnection,
  type DrizzleTransaction,
  getDraftByIdForUpdate,
  getFacultyAndStaff,
  getLabById,
  getPendingLabCountInDraft,
  incrementDraftRound,
} from '$lib/server/database/drizzle';
import { coerceNumber } from '$lib/coerce';
import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import {
  RoundStartedBatchEmailEvent,
  RoundSubmittedBatchEmailEvent,
} from '$lib/server/inngest/schema';
import { Tracer } from '$lib/server/telemetry/tracer';

const RankingsFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
  round: v.pipe(v.number(), v.integer(), v.minValue(1)),
  students: v.array(v.pipe(v.string(), v.minLength(1))),
});

const SERVICE_NAME = 'routes.dashboard.draft.students';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

function toRoundStartedPayload(round: number | null, maxRounds: number) {
  return round === null || round > maxRounds ? null : round;
}

export async function load({ locals: { session }, parent }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access students page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { id: sessionId, user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
    logger.fatal('insufficient permissions to access students page', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const { id: userId, labId } = user;
  return await tracer.asyncSpan('load-students-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });
    if (labId !== null) span.setAttribute('session.user.lab_id', labId);

    const { draft } = await parent();
    if (typeof draft === 'undefined') {
      logger.fatal('no active draft found');
      error(404);
    }

    logger.debug('active draft found', {
      'draft.id': draft.id.toString(),
      'draft.round.current': draft.currRound,
      'draft.round.max': draft.maxRounds,
    });

    const draftLabResult = await getLabAndRemainingStudentsInDraftWithLabPreference(
      db,
      draft.id,
      labId,
    );
    if (typeof draftLabResult === 'undefined') {
      logger.warn('lab not in draft snapshot', { 'lab.id': labId });
      return { draft };
    }

    const { lab, students, researchers, submissionSource, remainingQuota, autoAcknowledgeReason } =
      draftLabResult;
    logger.debug('lab and students fetched', {
      'lab.name': lab.name,
      'student.count': students.length,
      'lab.researcher_count': researchers.length,
      'draft.round.submission_source': submissionSource,
      'draft.round.remaining_quota': remainingQuota,
      'draft.round.auto_acknowledge_reason': autoAcknowledgeReason,
    });

    return {
      draft,
      info: {
        lab,
        students,
        researchers,
        submissionSource,
        remainingQuota,
        autoAcknowledgeReason,
      },
    };
  });
}

export const actions = {
  async rankings({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to submit rankings without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
      logger.fatal('insufficient permissions to submit rankings', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const lab = user.labId;
    const facultyUserId = user.id;
    return await tracer.asyncSpan('action.rankings', async () => {
      logger.debug('submitting rankings on behalf of lab head', {
        'lab.id': lab,
        'user.id': facultyUserId,
      });

      const data = await request.formData();
      const {
        draft,
        round: expectedRound,
        students,
      } = v.parse(RankingsFormData, decode(data, { arrays: ['students'], numbers: ['round'] }));
      logger.debug('rankings form received', {
        'draft.id': draft,
        'draft.round.expected': expectedRound,
        'student.ids': students,
      });

      const draftId = BigInt(draft);
      try {
        const { submittedRound, roundsToNotify, isCreate } = await db.transaction(
          async db => {
            const activeDraft = await getDraftByIdForUpdate(db, draftId);
            if (typeof activeDraft === 'undefined' || activeDraft.activePeriodEnd !== null) {
              logger.fatal('attempt to submit rankings for non-active draft', void 0, {
                'draft.id': draftId.toString(),
              });
              error(403);
            }

            if (
              activeDraft.currRound === null ||
              activeDraft.currRound <= 0 ||
              activeDraft.currRound > activeDraft.maxRounds
            ) {
              logger.fatal('attempt to submit rankings outside regular rounds', void 0, {
                'draft.id': draftId.toString(),
                'draft.round.current': activeDraft.currRound,
                'draft.round.max': activeDraft.maxRounds,
              });
              error(403);
            }

            if (activeDraft.currRound !== expectedRound)
              throw new RoundMismatchError(activeDraft.currRound, expectedRound);

            const autoAcknowledgeStatus = await getLabAutoAcknowledgeStatusInDraftRound(
              db,
              draftId,
              lab,
              activeDraft.currRound,
            );
            if (typeof autoAcknowledgeStatus === 'undefined') {
              logger.fatal(
                'attempt to submit rankings for lab outside active draft snapshot',
                void 0,
                {
                  'draft.id': draftId.toString(),
                  'lab.id': lab,
                },
              );
              error(403);
            }

            const { autoAcknowledgeReason, submissionSource } = autoAcknowledgeStatus;
            if (typeof autoAcknowledgeReason !== 'undefined') {
              logger.fatal('attempt to submit rankings for auto-acknowledged lab', void 0, {
                'draft.id': draftId.toString(),
                'lab.id': lab,
                'draft.round.current': activeDraft.currRound,
                'draft.round.auto_acknowledge_reason': autoAcknowledgeReason,
                'draft.round.submission_source': submissionSource,
              });
              error(409);
            }

            const { quota, selected } = await getLabQuotaAndSelectedStudentCountInDraft(
              db,
              draftId,
              lab,
            );
            assert(typeof quota !== 'undefined');

            const existingChoice = await getFacultyChoiceForLabInDraftRound(
              db,
              draftId,
              activeDraft.currRound,
              lab,
            );

            let baseSelected = selected;
            if (typeof existingChoice !== 'undefined') {
              if (existingChoice.userId !== facultyUserId)
                logger.warn("lab head editing another lab head's submission", {
                  'draft.id': draftId.toString(),
                  'draft.round.current': activeDraft.currRound,
                  'original.user_id': existingChoice.userId,
                  'editing.user_id': facultyUserId,
                });
              const selectedInCurrentRound = await getLabSelectedStudentCountInDraftRound(
                db,
                draftId,
                lab,
                activeDraft.currRound,
              );
              baseSelected = selected - selectedInCurrentRound;
            }

            const total = baseSelected + students.length;
            if (total > quota) {
              logger.fatal('total students exceeds quota', void 0, {
                'student.total': total,
                'lab.quota': quota,
              });
              error(403);
            }

            logger.debug('total students still within quota', {
              'student.total': total,
              'lab.quota': quota,
            });

            if (students.length > 0) {
              const validStudentIds = await validateStudentsChoseLabInRound(
                db,
                draftId,
                lab,
                activeDraft.currRound,
                students,
              );
              const invalidStudents = students.filter(id => !validStudentIds.has(id));
              if (invalidStudents.length > 0) {
                logger.fatal('students did not choose this lab for current round', void 0, {
                  'invalid.student_id': invalidStudents,
                });
                error(409);
              }
            }

            await upsertFacultyChoice(
              db,
              draftId,
              activeDraft.currRound,
              lab,
              facultyUserId,
              students,
            );

            const submittedRound = activeDraft.currRound;
            assert(
              submittedRound > 0 && submittedRound <= activeDraft.maxRounds,
              'cannot submit preferences outside regular rounds',
            );

            // Track data needed for notifications after transaction
            const roundsToNotify: (number | null)[] = [];
            while (true) {
              // Auto-acknowledge labs without preferences BEFORE checking pending count
              await autoAcknowledgeLabsWithoutPreferences(db, draftId);
              logger.debug('labs without preferences auto-acknowledged');

              const count = await getPendingLabCountInDraft(db, draftId);
              if (count > 0) {
                logger.debug('more pending labs found', { 'lab.pending_count': count });
                break;
              }

              const draftRound = await incrementDraftRound(db, draftId);
              assert(
                typeof draftRound !== 'undefined',
                'The draft to be incremented does not exist.',
              );
              logger.debug('draft round incremented', draftRound);

              roundsToNotify.push(
                toRoundStartedPayload(draftRound.currRound, draftRound.maxRounds),
              );

              if (draftRound.currRound === null || draftRound.currRound > draftRound.maxRounds) {
                logger.info('intervention round reached');
                break;
              }
            }

            return {
              submittedRound,
              roundsToNotify,
              isCreate: typeof existingChoice === 'undefined',
            };
          },
          { isolationLevel: 'read committed' },
        );

        // Dispatch notifications after successful transaction
        const [staffEmails, { name: labName }, facultyAndStaff] = await Promise.all([
          getValidStaffEmails(db),
          getLabById(db, lab),
          getFacultyAndStaff(db),
        ]);

        // CREATE: notify staff + all faculty
        // UPDATE: notify staff only
        const initialRecipients = new Set(staffEmails);
        if (isCreate) for (const person of facultyAndStaff) initialRecipients.add(person.email);

        const roundSubmittedEvents = Array.from(initialRecipients, email =>
          RoundSubmittedBatchEmailEvent.create({
            draftId: Number(draftId),
            round: submittedRound,
            labId: lab,
            labName,
            recipientEmail: email,
            isCreate,
          }),
        );

        const roundStartedEvents = roundsToNotify.flatMap(round =>
          facultyAndStaff.map(({ email, givenName, familyName }) =>
            RoundStartedBatchEmailEvent.create({
              draftId: Number(draftId),
              round,
              recipientEmail: email,
              recipientName: `${givenName} ${familyName}`,
            }),
          ),
        );

        await inngest.send([...roundSubmittedEvents, ...roundStartedEvents]);
        logger.info('student rankings submitted');
      } catch (err) {
        if (err instanceof RoundMismatchError) {
          logger.fatal('round mismatch - round may have advanced since page load', err, {
            'draft.id': draftId.toString(),
            'draft.round.current': err.currentRound,
            'draft.round.expected': err.expectedRound,
          });
          return fail(409);
        }
        throw err;
      }
    });
  },
};

class RoundMismatchError extends Error {
  constructor(
    public readonly currentRound: number,
    public readonly expectedRound: number,
  ) {
    super(`expected round ${expectedRound} but got round ${currentRound}`);
    this.name = 'RoundMismatchError';
  }
}

async function getValidStaffEmails(db: DbConnection) {
  return await tracer.asyncSpan('get-valid-staff-emails', async () => {
    const results = await db
      .select({ email: schema.user.email })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.isAdmin, true),
          isNull(schema.user.labId),
          isNotNull(schema.user.googleUserId),
        ),
      );
    return results.map(({ email }) => email);
  });
}

async function getLabAndRemainingStudentsInDraftWithLabPreference(
  db: DbConnection,
  draftId: bigint,
  labId: string,
) {
  return await tracer.asyncSpan(
    'get-lab-and-remaining-students-in-draft-with-lab-preference',
    async span => {
      span.setAttributes({ 'database.draft.id': draftId.toString(), 'database.lab.id': labId });
      const labInfo = await db
        .select({
          name: schema.lab.name,
          quota: schema.draftLabQuota.initialQuota,
        })
        .from(schema.draftLabQuota)
        .innerJoin(schema.lab, eq(schema.draftLabQuota.labId, schema.lab.id))
        .where(
          and(eq(schema.draftLabQuota.draftId, draftId), eq(schema.draftLabQuota.labId, labId)),
        )
        .then(assertOptional);
      if (typeof labInfo === 'undefined') return;

      const students = await db
        .select({
          id: schema.user.id,
          email: schema.user.email,
          givenName: schema.user.givenName,
          familyName: schema.user.familyName,
          avatarObjectKey: schema.studentRank.avatarObjectKey,
          studentNumber: schema.user.studentNumber,
          remark: schema.studentRankLab.remark,
        })
        .from(schema.studentRank)
        .innerJoin(schema.draft, eq(schema.studentRank.draftId, schema.draft.id))
        .leftJoin(
          schema.facultyChoiceUser,
          and(
            eq(schema.studentRank.draftId, schema.facultyChoiceUser.draftId),
            eq(schema.studentRank.userId, schema.facultyChoiceUser.studentUserId),
          ),
        )
        .innerJoin(
          schema.studentRankLab,
          and(
            eq(schema.studentRank.draftId, schema.studentRankLab.draftId),
            eq(schema.studentRank.userId, schema.studentRankLab.userId),
          ),
        )
        .innerJoin(schema.user, eq(schema.studentRank.userId, schema.user.id))
        .where(
          and(
            eq(schema.studentRank.draftId, draftId),
            or(
              isNull(schema.facultyChoiceUser.studentUserId),
              and(
                eq(schema.facultyChoiceUser.labId, labId),
                eq(schema.facultyChoiceUser.round, schema.draft.currRound),
              ),
            ),
            eq(schema.studentRankLab.index, schema.draft.currRound),
            eq(schema.studentRankLab.labId, labId),
          ),
        )
        .orderBy(schema.user.familyName);

      const researchers = await db
        .select({
          id: schema.user.id,
          round: sql`${schema.facultyChoiceUser.round}`.mapWith(coerceNumber),
          email: schema.user.email,
          givenName: schema.user.givenName,
          familyName: schema.user.familyName,
          avatarObjectKey: schema.studentRank.avatarObjectKey,
          studentNumber: schema.user.studentNumber,
        })
        .from(schema.facultyChoiceUser)
        .innerJoin(schema.user, eq(schema.facultyChoiceUser.studentUserId, schema.user.id))
        .leftJoin(
          schema.studentRank,
          and(
            eq(schema.studentRank.draftId, schema.facultyChoiceUser.draftId),
            eq(schema.studentRank.userId, schema.facultyChoiceUser.studentUserId),
          ),
        )
        .where(
          and(
            eq(schema.facultyChoiceUser.draftId, draftId),
            eq(schema.facultyChoiceUser.labId, labId),
            isNotNull(schema.facultyChoiceUser.round),
          ),
        );

      const choice = await db
        .select({ userId: schema.facultyChoice.userId })
        .from(schema.facultyChoice)
        .innerJoin(
          schema.draft,
          and(
            eq(schema.facultyChoice.draftId, schema.draft.id),
            eq(schema.facultyChoice.round, schema.draft.currRound),
          ),
        )
        .where(
          and(eq(schema.facultyChoice.draftId, draftId), eq(schema.facultyChoice.labId, labId)),
        )
        .then(assertOptional);

      // eslint-disable-next-line @typescript-eslint/init-declarations
      let submissionSource: 'faculty' | 'system' | undefined;
      if (typeof choice !== 'undefined')
        submissionSource = choice.userId === null ? 'system' : 'faculty';

      const remainingQuota = labInfo.quota - researchers.length;

      // eslint-disable-next-line @typescript-eslint/init-declarations
      let autoAcknowledgeReason: 'quota-exhausted' | 'no-preferences' | undefined;
      if (remainingQuota <= 0) autoAcknowledgeReason = 'quota-exhausted';
      else if (students.length === 0) autoAcknowledgeReason = 'no-preferences';

      return {
        lab: labInfo,
        students,
        researchers,
        submissionSource,
        remainingQuota,
        autoAcknowledgeReason,
      };
    },
  );
}

async function getLabAutoAcknowledgeStatusInDraftRound(
  db: DbConnection,
  draftId: bigint,
  labId: string,
  currRound: number,
) {
  return await tracer.asyncSpan('get-lab-auto-acknowledge-status-in-draft-round', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.lab.id': labId,
      'database.round': currRound,
    });

    const row = await db
      .select({
        initialQuota: schema.draftLabQuota.initialQuota,
        totalDrafted: count(schema.facultyChoiceUser.studentUserId),
        submissionLabId: schema.facultyChoice.labId,
        submissionUserId: schema.facultyChoice.userId,
      })
      .from(schema.draftLabQuota)
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.facultyChoiceUser.draftId, draftId),
          eq(schema.facultyChoiceUser.labId, labId),
        ),
      )
      .leftJoin(
        schema.facultyChoice,
        and(
          eq(schema.facultyChoice.draftId, draftId),
          eq(schema.facultyChoice.round, currRound),
          eq(schema.facultyChoice.labId, labId),
        ),
      )
      .where(and(eq(schema.draftLabQuota.draftId, draftId), eq(schema.draftLabQuota.labId, labId)))
      .groupBy(
        schema.draftLabQuota.initialQuota,
        schema.facultyChoice.labId,
        schema.facultyChoice.userId,
      )
      .then(assertOptional);
    if (typeof row === 'undefined') return;

    const { initialQuota, totalDrafted, submissionLabId, submissionUserId } = row;

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let autoAcknowledgeReason: 'quota-exhausted' | 'no-preferences' | undefined;
    if (totalDrafted >= initialQuota) {
      autoAcknowledgeReason = 'quota-exhausted';
    } else {
      const { preferrerCount } = await db
        .select({ preferrerCount: countDistinct(schema.studentRankLab.userId) })
        .from(schema.studentRankLab)
        .leftJoin(
          schema.facultyChoiceUser,
          and(
            eq(schema.studentRankLab.draftId, schema.facultyChoiceUser.draftId),
            eq(schema.studentRankLab.userId, schema.facultyChoiceUser.studentUserId),
          ),
        )
        .where(
          and(
            eq(schema.studentRankLab.draftId, draftId),
            eq(schema.studentRankLab.labId, labId),
            eq(schema.studentRankLab.index, BigInt(currRound)),
            or(
              isNull(schema.facultyChoiceUser.studentUserId),
              and(
                eq(schema.facultyChoiceUser.labId, labId),
                eq(schema.facultyChoiceUser.round, currRound),
              ),
            ),
          ),
        )
        .then(assertSingle);
      if (preferrerCount === 0) autoAcknowledgeReason = 'no-preferences';
    }

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let submissionSource: 'faculty' | 'system' | undefined;
    if (submissionLabId !== null)
      submissionSource = submissionUserId === null ? 'system' : 'faculty';

    return { autoAcknowledgeReason, submissionSource };
  });
}

async function getLabQuotaAndSelectedStudentCountInDraft(
  db: DbConnection,
  draftId: bigint,
  labId: string,
) {
  return await tracer.asyncSpan('get-lab-quota-and-selected-student-count-in-draft', async span => {
    span.setAttributes({ 'database.draft.id': draftId.toString(), 'database.lab.id': labId });

    const labInfo = await db
      .select({ quota: schema.draftLabQuota.initialQuota })
      .from(schema.draftLabQuota)
      .where(and(eq(schema.draftLabQuota.draftId, draftId), eq(schema.draftLabQuota.labId, labId)))
      .then(assertOptional);

    const draftCount = await db
      .select({ studentCount: count(schema.facultyChoiceUser.studentUserId) })
      .from(schema.facultyChoiceUser)
      .where(
        and(
          eq(schema.facultyChoiceUser.draftId, draftId),
          eq(schema.facultyChoiceUser.labId, labId),
        ),
      )
      .then(assertSingle);

    return {
      quota: labInfo?.quota,
      selected: draftCount.studentCount,
    };
  });
}

async function getFacultyChoiceForLabInDraftRound(
  db: DbConnection,
  draftId: bigint,
  round: number,
  labId: string,
) {
  return await tracer.asyncSpan('get-faculty-choice-for-lab-in-draft-round', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.round': round,
      'database.lab.id': labId,
    });
    return await db
      .select({
        draftId: schema.facultyChoice.draftId,
        round: schema.facultyChoice.round,
        labId: schema.facultyChoice.labId,
        userId: schema.facultyChoice.userId,
      })
      .from(schema.facultyChoice)
      .where(
        and(
          eq(schema.facultyChoice.draftId, draftId),
          eq(schema.facultyChoice.round, round),
          eq(schema.facultyChoice.labId, labId),
        ),
      )
      .then(assertOptional);
  });
}

async function getLabSelectedStudentCountInDraftRound(
  db: DbConnection,
  draftId: bigint,
  labId: string,
  round: number,
) {
  return await tracer.asyncSpan('get-lab-selected-student-count-in-draft-round', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.lab.id': labId,
      'database.round': round,
    });
    const { studentCount } = await db
      .select({ studentCount: count(schema.facultyChoiceUser.studentUserId) })
      .from(schema.facultyChoiceUser)
      .where(
        and(
          eq(schema.facultyChoiceUser.draftId, draftId),
          eq(schema.facultyChoiceUser.labId, labId),
          eq(schema.facultyChoiceUser.round, round),
        ),
      )
      .then(assertSingle);
    return studentCount;
  });
}

async function validateStudentsChoseLabInRound(
  db: DrizzleTransaction,
  draftId: bigint,
  labId: string,
  round: number,
  studentUserIds: string[],
) {
  return await tracer.asyncSpan('validate-students-chose-lab-in-round', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.lab.id': labId,
      'database.round': round,
      'database.student.count': studentUserIds.length,
    });

    if (studentUserIds.length === 0) return new Set();

    const draftedByOtherLab = db
      .select({ studentUserId: schema.facultyChoiceUser.studentUserId })
      .from(schema.facultyChoiceUser)
      .where(
        and(
          eq(schema.facultyChoiceUser.draftId, draftId),
          or(
            ne(schema.facultyChoiceUser.labId, labId),
            ne(schema.facultyChoiceUser.round, round),
            isNull(schema.facultyChoiceUser.round),
          ),
        ),
      );

    const validRows = await db
      .select({ userId: schema.studentRankLab.userId })
      .from(schema.studentRankLab)
      .where(
        and(
          eq(schema.studentRankLab.draftId, draftId),
          eq(schema.studentRankLab.labId, labId),
          eq(schema.studentRankLab.index, BigInt(round)),
          inArray(schema.studentRankLab.userId, studentUserIds),
          sql`${schema.studentRankLab.userId} not in (${draftedByOtherLab})`,
        ),
      )
      .for('update');

    return new Set(validRows.map(({ userId }) => userId));
  });
}

async function upsertFacultyChoice(
  db: DrizzleTransaction,
  draftId: bigint,
  round: number,
  labId: string,
  facultyUserId: string,
  studentUserIds: string[],
) {
  return await tracer.asyncSpan('upsert-faculty-choice', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.lab.id': labId,
      'database.user.id': facultyUserId,
    });

    await db
      .insert(schema.facultyChoice)
      .values({ draftId, round, labId, userId: facultyUserId })
      .onConflictDoUpdate({
        target: [
          schema.facultyChoice.draftId,
          schema.facultyChoice.round,
          schema.facultyChoice.labId,
        ],
        set: { userId: facultyUserId, createdAt: sql`now()` },
      });

    await db
      .delete(schema.facultyChoiceUser)
      .where(
        and(
          eq(schema.facultyChoiceUser.draftId, draftId),
          eq(schema.facultyChoiceUser.labId, labId),
          eq(schema.facultyChoiceUser.round, round),
        ),
      );

    if (studentUserIds.length > 0) {
      const { rowCount: facultyChoiceUserRowCount } = await db
        .insert(schema.facultyChoiceUser)
        .values(
          studentUserIds.map(
            studentUserId =>
              ({
                draftId,
                round,
                labId,
                facultyUserId,
                studentUserId,
              }) satisfies schema.NewFacultyChoiceUser,
          ),
        );
      strictEqual(
        facultyChoiceUserRowCount,
        studentUserIds.length,
        'upsertFacultyChoice::facultyChoiceUser => unexpected insertion count',
      );
    }
  });
}
