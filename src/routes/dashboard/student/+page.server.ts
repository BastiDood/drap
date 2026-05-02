import assert, { fail } from 'node:assert/strict';

import * as v from 'valibot';
import { and, asc, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { decode } from 'decode-formdata';
import { enumerate, izip } from 'itertools';
import { error, fail as actionFailure, redirect } from '@sveltejs/kit';
import { MaxBufferError } from 'get-stream';

import * as schema from '$lib/server/database/schema';
import { assertOptional, assertSingle } from '$lib/server/assert';
import { coerceDate, coerceNullableDate } from '$lib/coerce';
import { db } from '$lib/server/database';
import {
  type DbConnection,
  type DrizzleTransaction,
  getActiveDraft,
  getDraftLabQuotaLabIds,
  getLabById,
} from '$lib/server/database/drizzle';
import {
  deleteDraftAvatarObject,
  uploadDraftAvatarFromCdn,
  uploadDraftAvatarOverride,
} from '$lib/server/s3/draft-student-avatar';
import { Logger } from '$lib/server/telemetry/logger';
import {
  S3ContentTypeError,
  S3EmptyPayloadError,
  S3RemoteHostError,
  S3RemoteProtocolError,
  S3TooLargePayloadError,
} from '$lib/server/s3/util';
import { Tracer } from '$lib/server/telemetry/tracer';

const SubmitFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
  labs: v.array(v.pipe(v.string(), v.minLength(1))),
  remarks: v.array(v.string()),
  avatar: v.nullish(v.union([v.literal('google'), v.instance(File)])),
});

const SERVICE_NAME = 'routes.dashboard.student';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access student dashboard without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { id: sessionId, user } = session;

  // Only students allowed (not admin)
  if (user.isAdmin) {
    logger.fatal('admin attempting to access student dashboard', void 0, {
      'user.id': user.id,
      'user.is_admin': user.isAdmin,
    });
    error(403);
  }

  const {
    id: userId,
    email: userEmail,
    givenName,
    familyName,
    avatarUrl,
    studentNumber,
    labId,
  } = user;

  return await tracer.asyncSpan('load-student-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'session.user.email': userEmail,
    });

    logger.debug('student dashboard loaded', {
      'user.id': userId,
      'user.email': userEmail,
    });

    // Build base user object
    const baseUser = {
      id: userId,
      email: userEmail,
      givenName,
      familyName,
      avatarUrl,
      studentNumber,
    };

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let lab: Pick<schema.Lab, 'name'> | undefined;
    if (labId !== null) lab = await getLabById(db, labId);

    if (studentNumber === null) {
      logger.debug('user needs profile setup');
      return { user: baseUser, lab };
    }

    // Check for active draft
    const draft = await getActiveDraft(db);

    // NO_DRAFT: no active draft
    if (typeof draft === 'undefined') {
      logger.debug('no active draft');
      return { user: baseUser, lab };
    }

    const { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed } = draft;
    logger.debug('active draft found', {
      'draft.id': draftId.toString(),
      'draft.round.current': currRound,
      'draft.round.max': maxRounds,
    });

    // LOTTERY/REVIEW: intervention and review stages.
    if (currRound === null || currRound > maxRounds) {
      logger.debug('draft in lottery or review phase');
      return {
        user: baseUser,
        draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
        lab,
      };
    }

    // Check if user has submitted rankings
    const rankings = await getStudentRankings(db, draftId, userId);

    function buildSubmission(r: NonNullable<typeof rankings>) {
      return {
        createdAt: r.createdAt,
        avatarObjectKey: r.avatarObjectKey,
        labs: r.labRemarks.map(({ labId, labName, remark }) => ({
          id: labId,
          name: labName,
          remark,
        })),
      };
    }

    // Registration phase (currRound === 0)
    if (currRound === 0) {
      if (rankings) {
        // SUBMITTED: user already submitted during registration
        logger.debug('user already submitted rankings');
        return {
          user: baseUser,
          draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
          submission: buildSubmission(rankings),
          lab,
        };
      }

      // Check if registration is still open
      if (!isRegistrationClosed) {
        // REGISTRATION_OPEN: registration still open
        logger.debug('registration open');
        const availableLabs = await getDraftLabRegistry(db, draftId);
        return {
          user: baseUser,
          draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
          availableLabs: availableLabs.map(({ id, name }) => ({ id, name })),
          lab,
        };
      }

      if (await isUserInAllowlist(db, draft.id, user.id)) {
        logger.warn('registration is closed but student is in allowlist');
        const availableLabs = await getDraftLabRegistry(db, draftId);
        return {
          user: baseUser,
          draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
          availableLabs: availableLabs.map(({ id, name }) => ({ id, name })),
          lab,
          isInAllowlist: true,
        };
      }

      // Registration closed but currRound still 0 (waiting for draft to start)
      // REGISTRATION_CLOSED: user missed registration
      logger.debug('registration closed, user missed registration');
      return {
        user: baseUser,
        draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
        lab,
      };
    }

    // Draft in progress (currRound > 0)
    if (rankings) {
      // DRAFT_IN_PROGRESS: user submitted and draft is ongoing
      logger.debug('draft in progress, user submitted');
      return {
        user: baseUser,
        draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
        submission: buildSubmission(rankings),
        lab,
      };
    }

    // REGISTRATION_CLOSED: user didn't submit and draft already started
    logger.debug('draft in progress, user missed registration');
    return {
      user: baseUser,
      draft: { id: draftId, currRound, maxRounds, registrationClosedAt, isRegistrationClosed },
      lab,
    };
  });
}

export const actions = {
  async submit({ locals: { session }, request, fetch }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to submit lab rankings without session');
      error(401);
    }

    const { user } = session;
    if (
      user.isAdmin ||
      user.googleUserId === null ||
      user.labId !== null ||
      user.studentNumber === null
    ) {
      logger.fatal('insufficient permissions to submit lab rankings', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
        'user.student_number': user.studentNumber?.toString(),
      });
      error(403);
    }

    return await tracer.asyncSpan('action.submit', async () => {
      const data = await request.formData();
      const {
        draft: draftIdField,
        labs,
        remarks,
        avatar = null,
      } = v.parse(SubmitFormData, decode(data, { arrays: ['labs', 'remarks'], files: ['avatar'] }));

      logger.debug('lab rankings submitted', {
        'draft.id': draftIdField,
        'ranking.lab_count': labs.length,
        'ranking.remarks_count': remarks.length,
      });

      // Zero preferences allowed - student goes directly to lottery
      const draftId = BigInt(draftIdField);
      const duplicateLabIds = new Set<string>();
      const uniqueLabIds = new Set<string>();
      for (const labId of labs)
        if (uniqueLabIds.has(labId)) duplicateLabIds.add(labId);
        else uniqueLabIds.add(labId);

      if (duplicateLabIds.size > 0) {
        logger.fatal('submitted duplicate lab rankings', void 0, {
          'draft.id': draftId.toString(),
          'ranking.duplicate_lab_count': duplicateLabIds.size,
          'ranking.duplicate_lab_ids': Array.from(duplicateLabIds),
        });
        error(400);
      }

      // eslint-disable-next-line @typescript-eslint/init-declarations
      let objectKey: string | undefined;
      try {
        await db.transaction(
          async db => {
            const draft = await getDraftByIdForShare(db, draftId);
            if (typeof draft === 'undefined') {
              logger.fatal('cannot find the target draft');
              error(404);
            }

            const { currRound, maxRounds, registrationClosedAt, isRegistrationClosed } = draft;
            logger.debug('max rounds for target draft determined', {
              'draft.round.max': maxRounds,
            });
            if (currRound !== 0) {
              logger.fatal('cannot submit rankings to an ongoing draft', void 0, {
                'draft.round.current': currRound,
                'draft.round.max': maxRounds,
              });
              error(403);
            }

            if (isRegistrationClosed) {
              const isInAllowlist = await isUserInAllowlist(db, draftId, user.id);
              if (isInAllowlist) {
                logger.warn(
                  'attempt to submit rankings after registration closed but student is in allowlist',
                );
              } else {
                logger.fatal('attempt to submit rankings after registration closed', void 0, {
                  'draft.registration.closes_at': registrationClosedAt.toISOString(),
                });
                error(403);
              }
            }

            if (labs.length > maxRounds) {
              logger.fatal('lab rankings exceed max round', void 0, {
                'ranking.lab_count': labs.length,
              });
              error(400);
            }

            const snapshotLabIds = new Set(await getDraftLabQuotaLabIds(db, draftId));
            const unknownLabIds = Array.from(uniqueLabIds).filter(
              labId => !snapshotLabIds.has(labId),
            );
            if (unknownLabIds.length > 0) {
              logger.fatal('submitted rankings with labs outside draft snapshot', void 0, {
                'draft.id': draftId.toString(),
                'ranking.lab_count': labs.length,
                'ranking.snapshot_lab_count': snapshotLabIds.size,
                'ranking.unknown_lab_count': unknownLabIds.length,
                'ranking.unknown_lab_ids': unknownLabIds,
              });
              error(400);
            }

            if (avatar === null) {
              logger.warn('user explicitly opted out of avatar');
              await insertStudentRanking(db, draftId, user.id);
            } else {
              const key = await insertStudentRankingWithAvatar(db, draftId, user.id);
              if (typeof avatar === 'string') {
                logger.info('user explicitly opted in for default Google avatar');
                assert(user.avatarUrl.length > 0, 'missing google avatar URL');
                await uploadDraftAvatarFromCdn(key, user.avatarUrl, fetch);
              } else {
                logger.info('user explicitly opted in for custom avatar');
                await uploadDraftAvatarOverride(key, avatar);
              }
              objectKey = key; // assigned only after upload is complete
            }

            await insertStudentRankingLabs(db, draftId, user.id, labs, remarks);
          },
          { isolationLevel: 'read committed' },
        );
      } catch (error) {
        if (typeof objectKey !== 'undefined') {
          // Super rare case where an avatar object is left dangling due to unexpected database
          // transaction rollbacks. Only present after the upload is complete.
          logger.warn('deleting failed avatar object', {
            'draft.avatar.object_key': objectKey,
          });
          await deleteDraftAvatarObject(objectKey);
        }

        if (error instanceof S3ContentTypeError) {
          logger.fatal(error.message, void 0, { 'avatar.content_type': error.contentType });
          return actionFailure(415, {
            // We don't advertise SVG support for user uploads!
            message: 'Avatar must be a JPEG, PNG, or WebP image.',
          });
        } else if (error instanceof S3EmptyPayloadError) {
          logger.fatal(error.message);
          return actionFailure(400, { message: 'Avatar file is empty.' });
        } else if (error instanceof S3TooLargePayloadError) {
          logger.fatal(error.message, void 0, {
            'avatar.actual_size': error.size,
            'avatar.max_size': error.maxBytes,
          });
          return actionFailure(413, { message: 'Uploaded avatar file is too large.' });
        } else if (error instanceof S3RemoteProtocolError) {
          logger.fatal(error.message, void 0, { 'avatar.protocol': error.protocol });
          return actionFailure(400, {
            message: 'Your Google profile photo could not be fetched securely.',
          });
        } else if (error instanceof S3RemoteHostError) {
          logger.fatal(error.message, void 0, { 'avatar.host': error.host });
          return actionFailure(400, {
            message: 'Your Google profile photo URL is not supported.',
          });
        } else if (error instanceof MaxBufferError) {
          logger.fatal(error.message);
          return actionFailure(413, { message: 'Remote avatar file is too large.' });
        }
        throw error;
      }
    });
  },
};

const isRegistrationClosed = lt(schema.draft.registrationClosedAt, sql`now()`)
  .mapWith(Boolean)
  .as('is_registration_closed');

const StudentRankingLabRemark = v.array(
  v.object({ labId: v.string(), labName: v.string(), remark: v.string() }),
);

async function getDraftByIdForShare(db: DrizzleTransaction, id: bigint) {
  return await tracer.asyncSpan('get-draft-by-id-for-share', async span => {
    span.setAttribute('database.draft.id', id.toString());
    return await db
      .select({
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        registrationClosedAt: schema.draft.registrationClosedAt,
        isRegistrationClosed,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceNullableDate),
      })
      .from(schema.draft)
      .where(eq(schema.draft.id, id))
      .for('share')
      .then(assertOptional);
  });
}

async function getDraftLabRegistry(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-lab-registry', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        id: schema.draftLabQuota.labId,
        name: schema.lab.name,
      })
      .from(schema.draftLabQuota)
      .innerJoin(schema.lab, eq(schema.draftLabQuota.labId, schema.lab.id))
      .where(eq(schema.draftLabQuota.draftId, draftId))
      .orderBy(asc(schema.lab.name));
  });
}

async function insertStudentRanking(db: DbConnection, draftId: bigint, userId: string) {
  return await tracer.asyncSpan('insert-student-ranking', async span => {
    span.setAttributes({ 'database.draft.id': draftId.toString(), 'database.user.id': userId });
    const { rowCount } = await db.insert(schema.studentRank).values({ draftId, userId });
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        fail(`insertStudentRanking => unexpected insertion count ${rowCount}`);
    }
  });
}

async function insertStudentRankingWithAvatar(db: DbConnection, draftId: bigint, userId: string) {
  return await tracer.asyncSpan('insert-student-ranking-with-avatar', async span => {
    span.setAttributes({ 'database.draft.id': draftId.toString(), 'database.user.id': userId });
    const { avatarObjectKey } = await db
      .insert(schema.studentRank)
      .values({ draftId, userId, avatarObjectKey: sql`gen_random_uuid()` })
      .returning({ avatarObjectKey: schema.studentRank.avatarObjectKey })
      .then(assertSingle);
    assert(avatarObjectKey !== null, 'missing generated avatar object key');
    return avatarObjectKey;
  });
}

async function insertStudentRankingLabs(
  db: DrizzleTransaction,
  draftId: bigint,
  userId: string,
  labs: string[],
  remarks: string[],
) {
  return await tracer.asyncSpan('insert-student-ranking-labs', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.user.id': userId,
      'database.labs.count': labs.length,
      'database.remarks.count': remarks.length,
    });
    for (const [index, [labId, remark]] of enumerate(izip(labs, remarks)))
      await db
        .insert(schema.studentRankLab)
        .values({ draftId, userId, labId, index: BigInt(index + 1), remark });
  });
}

async function getStudentRankings(db: DbConnection, draftId: bigint, userId: string) {
  return await tracer.asyncSpan('get-student-rankings', async span => {
    span.setAttributes({ 'database.draft.id': draftId.toString(), 'database.user.id': userId });
    const sub = db
      .select({
        createdAt: schema.studentRank.createdAt,
        avatarObjectKey: schema.studentRank.avatarObjectKey,
        index: schema.studentRankLab.index,
        labId: schema.studentRankLab.labId,
        remark: schema.studentRankLab.remark,
      })
      .from(schema.studentRank)
      .leftJoin(
        schema.studentRankLab,
        and(
          eq(schema.studentRank.draftId, schema.studentRankLab.draftId),
          eq(schema.studentRank.userId, schema.studentRankLab.userId),
        ),
      )
      .where(and(eq(schema.studentRank.draftId, draftId), eq(schema.studentRank.userId, userId)))
      .as('_');
    return await db
      .select({
        createdAt: sub.createdAt,
        avatarObjectKey: sub.avatarObjectKey,
        labRemarks:
          sql`coalesce(jsonb_agg(jsonb_build_object('labId', ${sub.labId}, 'labName', ${schema.lab.name}, 'remark', ${sub.remark}) ORDER BY ${sub.index}) filter (where ${isNotNull(sub.labId)}), '[]'::jsonb)`.mapWith(
            vals => v.parse(StudentRankingLabRemark, vals),
          ),
      })
      .from(sub)
      .leftJoin(schema.lab, eq(sub.labId, schema.lab.id))
      .groupBy(sub.createdAt, sub.avatarObjectKey)
      .then(assertOptional);
  });
}

async function isUserInAllowlist(db: DbConnection, draftId: bigint, studentUserId: string) {
  return await tracer.asyncSpan('is-user-in-allowlist', async span => {
    span.setAttributes({
      'database.draft.id': draftId.toString(),
      'database.user.id': studentUserId,
    });
    const result = await db
      .select({ studentUserId: schema.draftRegistrationAllowlist.studentUserId })
      .from(schema.draftRegistrationAllowlist)
      .where(
        and(
          eq(schema.draftRegistrationAllowlist.draftId, draftId),
          eq(schema.draftRegistrationAllowlist.studentUserId, studentUserId),
        ),
      )
      .then(assertOptional);
    return typeof result !== 'undefined';
  });
}
