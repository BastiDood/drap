import { fail, strictEqual } from 'node:assert/strict';

import { alias } from 'drizzle-orm/pg-core';
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { array, date, number, object, parse, string, union } from 'valibot';
import { drizzle } from 'drizzle-orm/node-postgres';
import { enumerate, izip } from 'itertools';

import { assertOptional, assertSingle } from '$lib/server/assert';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import * as schema from './schema';

// Ensures that no database details are leaked at runtime.
export type { schema };

const SERVICE_NAME = 'database';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const StringArray = array(string());
const LabRemark = array(object({ lab: string(), remark: string() }));

/** Creates a new database instance. */
export function init(url: string) {
  return drizzle(url, { schema });
}

export type DrizzleDatabase = ReturnType<typeof init>;
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0];
export type DbConnection = DrizzleDatabase | DrizzleTransaction;

const ParsableDate = union([string(), number(), date()]);
function coerceDate(value: unknown) {
  return new Date(parse(ParsableDate, value));
}

export async function insertDummySession(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('insert-dummy-session', async span => {
    span.setAttribute('database.user.id', userId);
    const { sessionId } = await db
      .insert(schema.session)
      .values({ userId, expiration: sql`now() + interval '1 hour'` })
      .returning({ sessionId: schema.session.id })
      .then(assertSingle);
    return sessionId;
  });
}

export async function insertValidSession(db: DbConnection, userId: string, expiration: Date) {
  return await tracer.asyncSpan('insert-valid-session', async span => {
    span.setAttribute('database.user.id', userId);
    const { sessionId } = await db
      .insert(schema.session)
      .values({ userId, expiration })
      .returning({ sessionId: schema.session.id })
      .then(assertSingle);
    return sessionId;
  });
}

/** Dev-only: Updates the session's userId for user impersonation. */
export async function updateSessionUserId(db: DbConnection, sessionId: string, userId: string) {
  return await tracer.asyncSpan('update-session-user-id', async span => {
    span.setAttributes({ 'database.session.id': sessionId, 'database.user.id': userId });
    await db.update(schema.session).set({ userId }).where(eq(schema.session.id, sessionId));
  });
}

export async function getUserById(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('get-user-by-id', async span => {
    span.setAttribute('database.user.id', userId);
    const { id: _, ...columns } = getTableColumns(schema.user);
    return await db
      .select(columns)
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .then(assertSingle);
  });
}

export async function getUserFromValidSession(db: DbConnection, sessionId: string) {
  return await tracer.asyncSpan('get-user-from-valid-session', async span => {
    span.setAttribute('database.session.id', sessionId);
    const result = await db.query.session.findFirst({
      columns: {},
      with: { user: true },
      where: ({ id }, { eq }) => eq(id, sessionId),
    });
    return result?.user;
  });
}

export async function deleteValidSession(db: DbConnection, sessionId: string) {
  return await tracer.asyncSpan('delete-valid-session', async span => {
    span.setAttribute('database.session.id', sessionId);
    return await db
      .delete(schema.session)
      .where(eq(schema.session.id, sessionId))
      .returning({
        userId: schema.session.userId,
        expiration: schema.session.expiration,
      })
      .then(assertOptional);
  });
}

export async function upsertOpenIdUser(
  db: DbConnection,
  email: string,
  googleUserId: string | null,
  given: string,
  family: string,
  avatar: string,
) {
  return await tracer.asyncSpan('upsert-openid-user', async span => {
    span.setAttribute('database.user.email', email);
    return await db
      .insert(schema.user)
      .values({ email, googleUserId, givenName: given, familyName: family, avatarUrl: avatar })
      .onConflictDoUpdate({
        target: schema.user.email,
        set: {
          googleUserId: sql`excluded.${sql.raw(schema.user.googleUserId.name)}`,
          givenName: sql`coalesce(nullif(trim(${schema.user.givenName}), ''), excluded.${sql.raw(schema.user.givenName.name)})`,
          familyName: sql`coalesce(nullif(trim(${schema.user.familyName}), ''), excluded.${sql.raw(schema.user.familyName.name)})`,
          avatarUrl: sql`excluded.${sql.raw(schema.user.avatarUrl.name)}`,
        },
      })
      .returning({ id: schema.user.id, isAdmin: schema.user.isAdmin, labId: schema.user.labId })
      .then(assertSingle);
  });
}

export async function updateProfileByUserId(
  db: DbConnection,
  userId: string,
  studentNumber: bigint | null,
  given: string,
  family: string,
) {
  return await tracer.asyncSpan('update-profile-by-user-id', async span => {
    span.setAttribute('database.user.id', userId);
    await db
      .update(schema.user)
      .set({
        studentNumber: sql`coalesce(${schema.user.studentNumber}, ${studentNumber})`,
        givenName: given,
        familyName: family,
      })
      .where(and(eq(schema.user.id, userId)));
  });
}

export async function deleteOpenIdUser(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('delete-user', async span => {
    span.setAttribute('database.user.id', userId);
    await db.delete(schema.user).where(eq(schema.user.id, userId));
  });
}

export async function insertNewLab(db: DbConnection, id: string, name: string) {
  return await tracer.asyncSpan('insert-new-lab', async span => {
    span.setAttribute('database.lab.id', id);
    await db.insert(schema.lab).values({ id, name });
  });
}

export async function insertNewLabs(db: DbConnection, labs: Pick<schema.Lab, 'id' | 'name'>[]) {
  return await tracer.asyncSpan('insert-new-labs', async span => {
    span.setAttribute('database.lab.count', labs.length);
    await db.insert(schema.lab).values(labs);
  });
}

/** Soft-deletion of the lab (a.k.a. "archiving"). */
export async function deleteLab(db: DbConnection, id: string) {
  return await tracer.asyncSpan('delete-lab', async span => {
    span.setAttribute('database.lab.id', id);
    await db
      .update(schema.lab)
      .set({ deletedAt: new Date(), quota: 0 })
      .where(eq(schema.lab.id, id));
  });
}

/** Hard-deletion of the lab (a.k.a. "dropping"). */
export async function dropLabs(db: DbConnection, labIds: string[]) {
  return await tracer.asyncSpan('drop-labs', async span => {
    span.setAttribute('database.lab.count', labIds.length);
    await db.delete(schema.lab).where(inArray(schema.lab.id, labIds));
  });
}

export async function restoreLab(db: DbConnection, id: string) {
  return await tracer.asyncSpan('restore-lab', async span => {
    span.setAttribute('database.lab.id', id);
    await db.update(schema.lab).set({ deletedAt: null }).where(eq(schema.lab.id, id));
  });
}

export async function getLabRegistry(db: DbConnection, activeOnly = true) {
  return await tracer.asyncSpan('get-lab-registry', async span => {
    span.setAttribute('database.lab.active_only', activeOnly);
    const targetSchema = activeOnly ? schema.activeLabView : schema.lab;
    return await db
      .select({
        id: targetSchema.id,
        name: targetSchema.name,
        quota: targetSchema.quota,
        deletedAt: targetSchema.deletedAt,
      })
      .from(targetSchema)
      .orderBy(({ name }) => name);
  });
}

export async function getLabById(db: DbConnection, labId: string) {
  return await tracer.asyncSpan('get-lab-by-id', async span => {
    span.setAttribute('database.lab.id', labId);
    return await db
      .select({
        name: schema.lab.name,
      })
      .from(schema.lab)
      .where(eq(schema.lab.id, labId))
      .then(assertSingle);
  });
}

export async function isValidTotalLabQuota(db: DbConnection) {
  return await tracer.asyncSpan('is-valid-total-lab-quota', async () => {
    const { result } = await db
      .select({ result: sql`bool_or(${schema.lab.quota} > 0)`.mapWith(Boolean) })
      .from(schema.lab)
      .then(assertSingle);
    return result;
  });
}

export async function getLabCount(db: DbConnection, activeOnly = true) {
  return await tracer.asyncSpan('get-lab-count', async span => {
    span.setAttribute('database.lab.active_only', activeOnly);
    const targetSchema = activeOnly ? schema.activeLabView : schema.lab;
    const { result } = await db
      .select({ result: count(targetSchema.id) })
      .from(targetSchema)
      .then(assertSingle);
    return result;
  });
}

export async function getStudentCountInDraft(db: DbConnection, id: bigint) {
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

/** @deprecated Internally uses a `for` loop. */
export async function updateLabQuotas(
  db: DbConnection,
  quotas: Iterable<readonly [string, number]>,
) {
  return await tracer.asyncSpan('update-lab-quotas', async () => {
    for (const [id, quota] of quotas)
      await db.update(schema.lab).set({ quota }).where(eq(schema.lab.id, id));
  });
}

export async function getFacultyAndStaff(db: DbConnection) {
  return await tracer.asyncSpan('get-faculty-and-staff', async () => {
    return await db
      .select({
        id: schema.user.id,
        googleUserId: schema.user.googleUserId,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
        labName: schema.lab.name,
      })
      .from(schema.user)
      .leftJoin(schema.lab, eq(schema.user.labId, schema.lab.id))
      .where(eq(schema.user.isAdmin, true));
  });
}

export async function getValidStaffEmails(db: DbConnection) {
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

/** Ideally invoked from within a transaction. */
export async function getLabMembers(db: DbConnection, labId: string, draftId?: bigint) {
  return await tracer.asyncSpan('get-lab-members', async span => {
    span.setAttribute('database.lab.id', labId);
    if (typeof draftId !== 'undefined') span.setAttribute('database.draft.id', draftId.toString());
    const labInfo = await db.query.lab.findFirst({
      columns: { name: true },
      where: ({ id }) => eq(id, labId),
    });

    const heads = await db.query.user.findMany({
      columns: {
        email: true,
        givenName: true,
        familyName: true,
        avatarUrl: true,
      },
      where: and(
        isNotNull(schema.user.id),
        eq(schema.user.labId, labId),
        eq(schema.user.isAdmin, true),
      ),
      orderBy: ({ familyName }) => familyName,
    });

    const faculty = await db
      .select({
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
      })
      .from(schema.user)
      .leftJoin(
        schema.facultyChoiceUser,
        eq(schema.user.id, schema.facultyChoiceUser.studentUserId),
      )
      .where(
        and(
          eq(schema.user.labId, labId),
          eq(schema.user.isAdmin, false),
          isNull(schema.facultyChoiceUser.studentUserId),
        ),
      );

    const membersQuery =
      typeof draftId === 'undefined'
        ? db
            .select({
              draftId: schema.labMemberView.draftId,
              email: schema.labMemberView.email,
              givenName: schema.labMemberView.givenName,
              familyName: schema.labMemberView.familyName,
              avatarUrl: schema.labMemberView.avatarUrl,
            })
            .from(schema.labMemberView)
            .where(eq(schema.labMemberView.draftLab, labId))
            .orderBy(asc(schema.labMemberView.draftId), asc(schema.labMemberView.familyName))
        : db
            .select({
              draftId: schema.labMemberView.draftId,
              email: schema.labMemberView.email,
              givenName: schema.labMemberView.givenName,
              familyName: schema.labMemberView.familyName,
              avatarUrl: schema.labMemberView.avatarUrl,
            })
            .from(schema.labMemberView)
            .where(
              and(
                eq(schema.labMemberView.draftLab, labId),
                eq(schema.labMemberView.draftId, draftId),
              ),
            )
            .orderBy(asc(schema.labMemberView.draftId), asc(schema.labMemberView.familyName));
    return { lab: labInfo?.name, heads, members: await membersQuery, faculty };
  });
}

/**
 * Get the latest draft id that a user participated in to be assigned to a certain lab
 * @param userId The id of the user whose draft id is to be identified
 * @param labId The id of the lab they were assigned for
 */
export async function getUserLabAssignmentDraftId(db: DbConnection, userId: string, labId: string) {
  return await tracer.asyncSpan('get-user-lab-assignment-draft-id', async span => {
    span.setAttributes({ 'database.user.id': userId, 'database.lab.id': labId });
    return await db
      .select({ draftId: schema.labMemberView.draftId })
      .from(schema.labMemberView)
      .where(and(eq(schema.labMemberView.userId, userId), eq(schema.labMemberView.draftLab, labId)))
      .orderBy(desc(schema.labMemberView.draftId))
      .then(assertOptional);
  });
}

export async function getDrafts(db: DbConnection) {
  return await tracer.asyncSpan('get-drafts', async () => {
    return await db
      .select({
        id: schema.draft.id,
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        registrationClosesAt: schema.draft.registrationClosesAt,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`
          .mapWith(coerceDate)
          .as('_start'),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`
          .mapWith(value => (value === null ? null : coerceDate(value)))
          .as('_end'),
      })
      .from(schema.draft)
      .orderBy(({ activePeriodStart }) => sql`${desc(activePeriodStart)} NULLS FIRST`);
  });
}

export async function getDraftById(db: DbConnection, id: bigint) {
  return await tracer.asyncSpan('get-draft-by-id', async span => {
    span.setAttribute('database.draft.id', id.toString());
    return await db
      .select({
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        registrationClosesAt: schema.draft.registrationClosesAt,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .from(schema.draft)
      .where(eq(schema.draft.id, id))
      .then(assertOptional);
  });
}

export async function getActiveDraft(db: DbConnection) {
  return await tracer.asyncSpan('get-active-draft', async () => {
    return await db
      .select({
        id: schema.draft.id,
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        registrationClosesAt: schema.draft.registrationClosesAt,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .from(schema.draft)
      .where(sql`upper_inf(${schema.draft.activePeriod})`)
      .then(assertOptional);
  });
}

export async function hasActiveDraft(db: DbConnection) {
  return await tracer.asyncSpan('has-active-draft', async () => {
    const result = await db
      .select({ one: sql.raw('1') })
      .from(schema.draft)
      .where(isNull(sql`upper(${schema.draft.activePeriod})`))
      .limit(1)
      .then(assertOptional);
    return typeof result !== 'undefined';
  });
}

export async function getMaxRoundInDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-max-round-in-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const result = await db
      .select({ maxRounds: schema.draft.maxRounds })
      .from(schema.draft)
      .where(eq(schema.draft.id, draftId))
      .then(assertOptional);
    return result?.maxRounds;
  });
}

export async function getStudentsInDraftTaggedByLab(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-students-in-draft-tagged-by-lab', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
        studentNumber: schema.user.studentNumber,
        labs: sql`array_agg(${schema.studentRankLab.labId} ORDER BY ${schema.studentRankLab.index})`
          .mapWith(value => parse(StringArray, value))
          .as('labs'),
        labId: schema.facultyChoiceUser.labId,
      })
      .from(schema.studentRank)
      .innerJoin(schema.user, eq(schema.studentRank.userId, schema.user.id))
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
      .where(eq(schema.studentRank.draftId, draftId))
      .groupBy(schema.user.id, schema.facultyChoiceUser.labId)
      .orderBy(schema.user.familyName);
  });
}

/**
 * Typically invoked from within a transaction.
 *
 * For a lab to be auto-acknowledged:
 * 1. The lab has exhausted their entire quota (i.e., no remaining quota).
 * 2. The lab must not be preferred by anyone in the current draft round.
 */
export async function getLabAndRemainingStudentsInDraftWithLabPreference(
  db: DbConnection,
  draftId: bigint,
  labId: string,
) {
  return await tracer.asyncSpan(
    'get-lab-and-remaining-students-in-draft-with-lab-preference',
    async span => {
      span.setAttribute('database.draft.id', draftId.toString());
      span.setAttribute('database.lab.id', labId);
      const labInfo = await db.query.lab.findFirst({
        columns: { name: true, quota: true },
        where: ({ id }) => eq(id, labId),
      });

      const students = await db
        .select({
          id: schema.user.id,
          email: schema.user.email,
          givenName: schema.user.givenName,
          familyName: schema.user.familyName,
          avatarUrl: schema.user.avatarUrl,
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
            isNull(schema.facultyChoiceUser.studentUserId),
            eq(schema.studentRankLab.index, schema.draft.currRound),
            eq(schema.studentRankLab.labId, labId),
          ),
        )
        .orderBy(schema.user.familyName);

      const researchers = await db
        .select({
          email: schema.user.email,
          givenName: schema.user.givenName,
          familyName: schema.user.familyName,
          avatarUrl: schema.user.avatarUrl,
          studentNumber: schema.user.studentNumber,
        })
        .from(schema.facultyChoiceUser)
        .innerJoin(schema.user, eq(schema.facultyChoiceUser.studentUserId, schema.user.id))
        .where(
          and(
            eq(schema.facultyChoiceUser.draftId, draftId),
            eq(schema.facultyChoiceUser.labId, labId),
          ),
        );

      const chosen = await db
        .select({ createdAt: schema.facultyChoice.createdAt })
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
        );

      return { lab: labInfo, students, researchers, isDone: chosen.length > 0 };
    },
  );
}

/** Typically invoked from within a transaction. */
export async function autoAcknowledgeLabsWithoutPreferences(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('auto-acknowledge-labs-without-preferences', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    // Define the draft CTE
    const draftsCte = db
      .$with('_drafts')
      .as(
        db
          .select({ draftId: schema.draft.id, currRound: schema.draft.currRound })
          .from(schema.draft)
          .where(eq(schema.draft.id, draftId)),
      );

    // Define the drafted students CTE
    const draftedCte = db.$with('_drafted').as(
      db
        .with(draftsCte)
        .select({
          labId: schema.facultyChoiceUser.labId,
          draftees: count(schema.facultyChoiceUser.studentUserId).as('draftees'),
        })
        .from(draftsCte)
        .innerJoin(
          schema.facultyChoiceUser,
          eq(draftsCte.draftId, schema.facultyChoiceUser.draftId),
        )
        .where(eq(schema.facultyChoiceUser.draftId, draftId))
        .groupBy(schema.facultyChoiceUser.labId),
    );

    // Define the preferred labs CTE
    const preferredSubquery = db
      .with(draftsCte)
      .select({
        labId: schema.studentRankLab.labId,
        studentUserId: schema.studentRank.userId,
      })
      .from(draftsCte)
      .innerJoin(schema.studentRank, eq(draftsCte.draftId, schema.studentRank.draftId))
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(draftsCte.draftId, schema.facultyChoiceUser.draftId),
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
      .where(
        and(
          isNull(schema.facultyChoiceUser.studentUserId),
          eq(schema.studentRankLab.index, draftsCte.currRound),
        ),
      )
      .as('_');
    const preferredCte = db.$with('_preferred').as(
      db
        .select({
          labId: preferredSubquery.labId,
          preferrers: countDistinct(preferredSubquery.studentUserId).as('preferrers'),
        })
        .from(preferredSubquery)
        .groupBy(preferredSubquery.labId),
    );

    await db.transaction(async txn => {
      const toAcknowledge = await txn
        .with(draftsCte, draftedCte, preferredCte)
        .select({
          draftId: draftsCte.draftId,
          round: draftsCte.currRound,
          labId: schema.activeLabView.id,
        })
        .from(draftsCte)
        .crossJoin(schema.activeLabView)
        .leftJoin(draftedCte, eq(schema.activeLabView.id, draftedCte.labId))
        .leftJoin(preferredCte, eq(schema.activeLabView.id, preferredCte.labId))
        .where(
          or(
            gte(sql`coalesce(${draftedCte.draftees}, 0)`, schema.activeLabView.quota),
            eq(sql`coalesce(${preferredCte.preferrers}, 0)`, 0),
          ),
        );

      for (const row of toAcknowledge) await txn.insert(schema.facultyChoice).values(row);
    });
  });
}

export async function getLabQuotaAndSelectedStudentCountInDraft(
  db: DbConnection,
  draftId: bigint,
  labId: string,
) {
  return await tracer.asyncSpan('get-lab-quota-and-selected-student-count-in-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    span.setAttribute('database.lab.id', labId);
    const labInfo = await db.query.lab.findFirst({
      columns: { quota: true },
      where: ({ id }, { eq }) => eq(id, labId),
    });

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

export async function initDraft(db: DbConnection, maxRounds: number, registrationClosesAt: Date) {
  return await tracer.asyncSpan('init-draft', async span => {
    span.setAttribute('database.draft.max_rounds', maxRounds);
    return await db
      .insert(schema.draft)
      .values({ maxRounds, registrationClosesAt })
      .returning({
        id: schema.draft.id,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .then(assertSingle);
  });
}

export async function incrementDraftRound(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('increment-draft-round', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .update(schema.draft)
      .set({
        currRound: sql`case when ${schema.draft.currRound} < ${schema.draft.maxRounds} then ${schema.draft.currRound} + 1 else null end`,
      })
      .where(eq(schema.draft.id, draftId))
      .returning({
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
      })
      .then(assertOptional);
  });
}

export async function randomizeRemainingStudents(db: DbConnection, draftId: bigint) {
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

export async function concludeDraft(db: DbConnection, draftId: bigint) {
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

export async function insertStudentRanking(
  db: DbConnection,
  draftId: bigint,
  userId: string,
  labs: string[],
  remarks: string[],
) {
  return await tracer.asyncSpan('insert-student-ranking', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    span.setAttribute('database.user.id', userId);
    await db.transaction(async txn => {
      await txn
        .insert(schema.studentRank)
        .values({ draftId, userId })
        .onConflictDoNothing({ target: [schema.studentRank.draftId, schema.studentRank.userId] });

      for (const [index, [labId, remark]] of enumerate(izip(labs, remarks)))
        await txn
          .insert(schema.studentRankLab)
          .values({ draftId, userId, labId, index: BigInt(index + 1), remark });
    });
  });
}

export async function getStudentRankings(db: DbConnection, draftId: bigint, userId: string) {
  return await tracer.asyncSpan('get-student-rankings', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    span.setAttribute('database.user.id', userId);
    const sub = db
      .select({
        createdAt: schema.studentRank.createdAt,
        index: schema.studentRankLab.index,
        labId: schema.studentRankLab.labId,
        remark: schema.studentRankLab.remark,
      })
      .from(schema.studentRank)
      .innerJoin(
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
        labRemarks:
          sql`jsonb_agg(jsonb_build_object('lab', ${schema.activeLabView.name}, 'remark', ${sub.remark}) ORDER BY ${sub.index})`.mapWith(
            vals => parse(LabRemark, vals),
          ),
      })
      .from(sub)
      .innerJoin(schema.activeLabView, eq(sub.labId, schema.activeLabView.id))
      .groupBy(sub.createdAt)
      .then(assertOptional);
  });
}

export async function getCandidateSenders(db: DbConnection) {
  return await tracer.asyncSpan('get-candidate-senders', async () => {
    return await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
        isActive: isNotNull(schema.designatedSender.candidateSenderUserId).mapWith(Boolean),
      })
      .from(schema.candidateSender)
      .innerJoin(schema.user, eq(schema.candidateSender.userId, schema.user.id))
      .leftJoin(
        schema.designatedSender,
        eq(schema.candidateSender.userId, schema.designatedSender.candidateSenderUserId),
      )
      .where(
        and(isNotNull(schema.user.id), eq(schema.user.isAdmin, true), isNull(schema.user.labId)),
      )
      .orderBy(schema.user.familyName);
  });
}

/**
 * A designated sender is an admin (i.e., `is_admin=True` and `lab_id=NULL`) with valid
 * OAuth 2.0 credentials such that the access token will not expire in the next five minutes.
 */
export async function getDesignatedSenderCredentialsForUpdate(db: DrizzleTransaction) {
  return await tracer.asyncSpan('get-designated-sender-credentials', async () => {
    return await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        accessToken: schema.candidateSender.accessToken,
        refreshToken: schema.candidateSender.refreshToken,
        scopes: schema.candidateSender.scopes,
        isValid: lt(schema.candidateSender.expiration, sql`now()`).mapWith(Boolean),
      })
      .from(schema.designatedSender)
      .innerJoin(
        schema.candidateSender,
        eq(schema.designatedSender.candidateSenderUserId, schema.candidateSender.userId),
      )
      .innerJoin(schema.user, eq(schema.designatedSender.candidateSenderUserId, schema.user.id))
      .where(
        and(
          isNotNull(schema.user.googleUserId),
          eq(schema.user.isAdmin, true),
          isNull(schema.user.labId),
        ),
      )
      .for('update')
      .then(assertOptional);
  });
}

export async function updateCandidateSender(
  db: DbConnection,
  userId: string,
  expiresIn: number,
  scopes: string[],
  accessToken: string,
  refreshToken?: string,
) {
  return await tracer.asyncSpan('update-candidate-sender', async span => {
    span.setAttributes({
      'database.user.id': userId,
      'database.candidate_sender.expires_in': expiresIn,
    });
    const { rowCount } = await db
      .update(schema.candidateSender)
      .set({
        userId,
        accessToken,
        scopes,
        refreshToken: refreshToken ?? schema.candidateSender.refreshToken,
        expiration: sql`now() + make_interval(secs => ${expiresIn})`,
      })
      .where(eq(schema.candidateSender.userId, userId));
    logger.debug('updated candidate sender', { rowCount });
  });
}

export async function upsertCandidateSender(
  db: DbConnection,
  userId: string,
  expiration: Date,
  accessToken: string,
  refreshToken: string,
  scopes: string[],
) {
  return await tracer.asyncSpan('upsert-candidate-sender', async span => {
    span.setAttribute('database.user.id', userId);
    const { rowCount } = await db
      .insert(schema.candidateSender)
      .values({ userId, expiration, accessToken, refreshToken, scopes })
      .onConflictDoUpdate({
        target: schema.candidateSender.userId,
        set: {
          updatedAt: sql`now()`,
          expiration: sql`excluded.${sql.raw(schema.candidateSender.expiration.name)}`,
          accessToken: sql`excluded.${sql.raw(schema.candidateSender.accessToken.name)}`,
          refreshToken: sql`excluded.${sql.raw(schema.candidateSender.refreshToken.name)}`,
          scopes: sql`excluded.${sql.raw(schema.candidateSender.scopes.name)}`,
        },
      });
    switch (rowCount) {
      case 1:
        return;
      default:
        fail(`upsertCandidateSender => unexpected insertion count ${rowCount}`);
    }
  });
}

export async function deleteCandidateSender(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('delete-candidate-sender', async span => {
    span.setAttribute('database.user.id', userId);
    const { rowCount } = await db
      .delete(schema.candidateSender)
      .where(eq(schema.candidateSender.userId, userId));
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        fail(`deleteCandidateSender => unexpected delete count ${count}`);
    }
  });
}

export async function deleteDesignatedSender(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('delete-designated-sender', async span => {
    span.setAttribute('database.user.id', userId);
    const { rowCount } = await db
      .delete(schema.designatedSender)
      .where(eq(schema.designatedSender.candidateSenderUserId, userId));
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        fail(`deleteDesignatedSender => unexpected delete count ${rowCount}`);
    }
  });
}

export async function upsertDesignatedSender(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('upsert-designated-sender', async span => {
    span.setAttribute('database.user.id', userId);
    const { rowCount } = await db
      .insert(schema.designatedSender)
      .values({ candidateSenderUserId: userId })
      .onConflictDoNothing({ target: schema.designatedSender.candidateSenderUserId });
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        fail(`upsertDesignatedSender => unexpected insertion count ${rowCount}`);
    }
  });
}

/**
 * Typically invoked from within a transaction.
 *
 * The operation of inserting a faculty choice must necessarily occur
 * with the updating of a student_rank entry's chosen_by field; note
 * the two return values for this function.
 *
 * @deprecated This is due for a refactor.
 * @returns The current draft based on the `draftId` provided.
 */
export async function insertFacultyChoice(
  db: DbConnection,
  draftId: bigint,
  labId: string,
  facultyUserId: string,
  studentUserIds: string[],
) {
  return await tracer.asyncSpan('insert-faculty-choice', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    span.setAttribute('database.lab.id', labId);
    span.setAttribute('database.user.id', facultyUserId);
    const draft = await db.query.draft.findFirst({
      columns: { currRound: true },
      where: ({ id }, { eq }) => eq(id, draftId),
    });
    if (typeof draft === 'undefined') return;

    const { rowCount: facultyChoiceRowCount } = await db
      .insert(schema.facultyChoice)
      .values({ draftId, round: draft.currRound, labId, userId: facultyUserId });
    strictEqual(
      facultyChoiceRowCount,
      1,
      'insertFacultyChoice::facultyChoice => unexpected insertion count',
    );

    if (studentUserIds.length > 0) {
      const { rowCount: facultyChoiceUserRowCount } = await db
        .insert(schema.facultyChoiceUser)
        .values(
          studentUserIds.map(
            studentUserId =>
              ({
                draftId,
                round: draft.currRound,
                labId,
                facultyUserId,
                studentUserId,
              }) satisfies schema.NewFacultyChoiceUser,
          ),
        );
      strictEqual(
        facultyChoiceUserRowCount,
        studentUserIds.length,
        'insertFacultyChoiceUser::facultyChoiceUser => unexpected insertion count',
      );
    }

    return draft;
  });
}

/** Typically invoked from within a transaction. */
export async function insertLotteryChoices(
  db: DbConnection,
  draftId: bigint,
  adminUserId: string,
  assignmentUserIdToLabPairs: (readonly [string, string])[],
) {
  return await tracer.asyncSpan('insert-lottery-choices', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    span.setAttribute('database.user.admin_id', adminUserId);
    const draft = await db.query.draft.findFirst({
      columns: { currRound: true },
      where: ({ id }, { eq }) => eq(id, draftId),
    });
    if (typeof draft === 'undefined') return;

    const labs = await db.select().from(schema.activeLabView);
    if (labs.length === 0) return;

    await db
      .insert(schema.facultyChoice)
      .values(
        labs.map(
          ({ id }) =>
            ({
              draftId,
              round: draft.currRound,
              labId: id,
              // Non-null to assert that the lottery was initiated by the admin.
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

    if (assignmentUserIdToLabPairs.length > 0)
      await db.insert(schema.facultyChoiceUser).values(
        assignmentUserIdToLabPairs.map(
          ([studentUserId, labId]) =>
            ({
              // This *must* be `null` to assert that this was chosen by the lottery.
              facultyUserId: null,
              studentUserId,
              draftId,
              round: draft.currRound,
              labId,
            }) satisfies schema.NewFacultyChoiceUser,
        ),
      );

    return draft;
  });
}

export async function getPendingLabCountInDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-pending-lab-count-in-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const subquery = db
      .select({ labId: schema.facultyChoice.labId })
      .from(schema.facultyChoice)
      .innerJoin(
        schema.draft,
        and(
          eq(schema.facultyChoice.draftId, schema.draft.id),
          eq(schema.facultyChoice.round, schema.draft.currRound),
        ),
      )
      .where(eq(schema.facultyChoice.draftId, draftId))
      .as('_');
    const { pendingCount } = await db
      .select({ pendingCount: count(schema.activeLabView.id) })
      .from(schema.activeLabView)
      .leftJoin(subquery, eq(schema.activeLabView.id, subquery.labId))
      .where(isNull(subquery.labId))
      .then(assertSingle);
    return pendingCount;
  });
}

export async function getFacultyChoiceRecords(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-faculty-choice-records', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const facultyUser = alias(schema.user, 'faculty_user');
    const studentUser = alias(schema.user, 'student_user');
    return await db
      .select({
        draftId: schema.facultyChoice.draftId,
        round: schema.facultyChoice.round,
        labId: schema.facultyChoice.labId,
        createdAt: schema.facultyChoice.createdAt,
        userId: schema.facultyChoice.userId,
        userEmail: facultyUser.email,
        studentEmail: studentUser.email,
      })
      .from(schema.facultyChoice)
      .leftJoin(facultyUser, eq(schema.facultyChoice.userId, facultyUser.id))
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.facultyChoice.draftId, schema.facultyChoiceUser.draftId),
          eq(schema.facultyChoice.round, schema.facultyChoiceUser.round),
          eq(schema.facultyChoice.labId, schema.facultyChoiceUser.labId),
        ),
      )
      .leftJoin(studentUser, eq(schema.facultyChoiceUser.studentUserId, studentUser.id))
      .where(eq(schema.facultyChoice.draftId, draftId))
      .orderBy(
        desc(schema.facultyChoice.createdAt),
        desc(schema.facultyChoice.round),
        asc(schema.facultyChoice.labId),
      );
  });
}

export async function getStudentRanksExport(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-student-ranks-export', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        createdAt: schema.studentRank.createdAt,
        email: schema.user.email,
        studentNumber: schema.user.studentNumber,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        labRanks:
          sql`array_agg(${schema.activeLabView.id} ORDER BY ${schema.studentRankLab.index})`.mapWith(
            vals => parse(StringArray, vals),
          ),
      })
      .from(schema.studentRank)
      .innerJoin(schema.user, eq(schema.studentRank.userId, schema.user.id))
      .innerJoin(
        schema.studentRankLab,
        and(
          eq(schema.studentRank.draftId, schema.studentRankLab.draftId),
          eq(schema.studentRank.userId, schema.studentRankLab.userId),
        ),
      )
      .innerJoin(schema.activeLabView, eq(schema.studentRankLab.labId, schema.activeLabView.id))
      .where(eq(schema.studentRank.draftId, draftId))
      .groupBy(schema.user.id, schema.studentRank.createdAt)
      .orderBy(schema.user.familyName);
  });
}

export async function getDraftResultsExport(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-results-export', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const facultyUser = alias(schema.user, 'faculty_user');
    const studentUser = alias(schema.user, 'student_user');
    return await db
      .select({
        studentEmail: studentUser.email,
        studentNumber: studentUser.studentNumber,
        studentFamilyName: studentUser.familyName,
        studentGivenName: studentUser.givenName,
        facultyEmail: facultyUser.email,
        facultyFamilyName: facultyUser.familyName,
        facultyGivenName: facultyUser.givenName,
        round: schema.facultyChoiceUser.round,
        lab: schema.lab.id,
      })
      .from(schema.facultyChoiceUser)
      .innerJoin(schema.lab, eq(schema.facultyChoiceUser.labId, schema.lab.id))
      .leftJoin(facultyUser, eq(schema.facultyChoiceUser.facultyUserId, facultyUser.id))
      .innerJoin(studentUser, eq(schema.facultyChoiceUser.studentUserId, studentUser.id))
      .where(eq(schema.facultyChoiceUser.draftId, draftId))
      .orderBy(asc(schema.facultyChoiceUser.round), asc(schema.lab.id), asc(studentUser.email));
  });
}

export async function getDraftEvents(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-events', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        createdAt: schema.facultyChoice.createdAt,
        round: schema.facultyChoice.round,
        labId: schema.facultyChoice.labId,
        isSystem: isNull(schema.facultyChoice.userId),
      })
      .from(schema.facultyChoice)
      .where(eq(schema.facultyChoice.draftId, draftId))
      .orderBy(({ createdAt, round, labId }) => [desc(createdAt), desc(round), asc(labId)]);
  });
}

export async function inviteNewFacultyOrStaff(
  db: DbConnection,
  email: string,
  labId: string | null,
) {
  return await tracer.asyncSpan('invite-new-faculty-or-staff', async span => {
    span.setAttribute('database.user.email', email);
    if (labId !== null) span.setAttribute('database.lab.id', labId);
    const { rowCount } = await db
      .insert(schema.user)
      .values({ email, labId, isAdmin: true })
      .onConflictDoNothing({ target: schema.user.email });
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        fail(`inviteNewFacultyOrStaff => unexpected insertion count ${rowCount}`);
    }
  });
}

/**
 * Synchronizes user objects with draft results by assigning student-users' lab fields to their
 * respective labs (as reflected by the faculty choices) for a given draft.
 */
export async function syncResultsToUsers(db: DbConnection, draftId: bigint) {
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

/** Dev-only: Updates the user's admin status and lab assignment. */
export async function updateUserRole(
  db: DbConnection,
  userId: string,
  isAdmin: boolean,
  labId: string | null,
) {
  return await tracer.asyncSpan('update-user-role', async span => {
    span.setAttributes({
      'database.user.id': userId,
      'database.user.is_admin': isAdmin,
    });
    if (labId !== null) span.setAttribute('database.lab.id', labId);
    await db.update(schema.user).set({ isAdmin, labId }).where(eq(schema.user.id, userId));
  });
}

/**
 * Test helper: Creates a user with explicit isAdmin and labId.
 * Combines upsertOpenIdUser + updateUserRole for test fixtures.
 */
export async function upsertTestUser(
  db: DbConnection,
  email: string,
  labId: string | null,
  given: string,
  family: string,
  avatar: string,
) {
  const { id: userId } = await upsertOpenIdUser(db, email, `test-${email}`, given, family, avatar);
  const isAdmin = labId !== null || (email.endsWith('@up.edu.ph') && email.startsWith('admin'));
  await updateUserRole(db, userId, isAdmin, labId);
  return { id: userId, isAdmin, labId };
}
