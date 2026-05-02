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
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

import { assertOptional, assertSingle } from '$lib/server/assert';
import { coerceDate, coerceNullableDate } from '$lib/coerce';
import { Tracer } from '$lib/server/telemetry/tracer';

import * as schema from './schema';

// Ensures that no database details are leaked at runtime.
export type { schema };

const SERVICE_NAME = 'database';
const tracer = Tracer.byName(SERVICE_NAME);

/** Creates a new database instance. */
export function init(url: string) {
  return drizzle(url, { schema });
}

export type DrizzleDatabase = ReturnType<typeof init>;
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0];
export type DbConnection = DrizzleDatabase | DrizzleTransaction;

const isRegistrationClosed = lt(schema.draft.registrationClosedAt, sql`now()`)
  .mapWith(Boolean)
  .as('is_registration_closed');

export async function insertDummySession(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('insert-dummy-session', async span => {
    span.setAttribute('database.user.id', userId);
    const { sessionId } = await db
      .insert(schema.session)
      .values({ userId, expiredAt: sql`now() + interval '1 hour'` })
      .returning({ sessionId: schema.session.id })
      .then(assertSingle);
    return sessionId;
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
        expiredAt: schema.session.expiredAt,
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

export async function getLabRegistry(db: DbConnection, activeOnly = true) {
  return await tracer.asyncSpan('get-lab-registry', async span => {
    span.setAttribute('database.lab.active_only', activeOnly);
    const targetSchema = activeOnly ? schema.activeLabView : schema.lab;
    return await db
      .select({
        id: targetSchema.id,
        name: targetSchema.name,
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

export async function getDraftLabQuotaLabIds(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-lab-quota-lab-ids', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const rows = await db
      .select({ labId: schema.draftLabQuota.labId })
      .from(schema.draftLabQuota)
      .where(eq(schema.draftLabQuota.draftId, draftId));
    return rows.map(({ labId }) => labId);
  });
}

export async function getFacultyAndStaff(db: DbConnection) {
  return await tracer.asyncSpan('get-faculty-and-staff', async () => {
    return await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
        labName: schema.lab.name,
      })
      .from(schema.user)
      .leftJoin(schema.lab, eq(schema.user.labId, schema.lab.id))
      .where(and(eq(schema.user.isAdmin, true), isNotNull(schema.user.googleUserId)));
  });
}

export async function getDrafts(db: DbConnection) {
  return await tracer.asyncSpan('get-drafts', async () => {
    return await db
      .select({
        id: schema.draft.id,
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        registrationClosedAt: schema.draft.registrationClosedAt,
        isRegistrationClosed,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`
          .mapWith(coerceDate)
          .as('_start'),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`
          .mapWith(coerceNullableDate)
          .as('_end'),
        startedAt: schema.draft.startedAt,
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
        registrationClosedAt: schema.draft.registrationClosedAt,
        startedAt: schema.draft.startedAt,
        isRegistrationClosed,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceNullableDate),
      })
      .from(schema.draft)
      .where(eq(schema.draft.id, id))
      .then(assertOptional);
  });
}

export async function getDraftByIdForUpdate(db: DrizzleTransaction, id: bigint) {
  return await tracer.asyncSpan('get-draft-by-id-for-update', async span => {
    span.setAttribute('database.draft.id', id.toString());
    return await db
      .select({
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        registrationClosedAt: schema.draft.registrationClosedAt,
        startedAt: schema.draft.startedAt,
        isRegistrationClosed,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceNullableDate),
      })
      .from(schema.draft)
      .where(eq(schema.draft.id, id))
      .for('update')
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
        registrationClosedAt: schema.draft.registrationClosedAt,
        isRegistrationClosed,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .from(schema.draft)
      .where(sql`upper_inf(${schema.draft.activePeriod})`)
      .then(assertOptional);
  });
}

export async function autoAcknowledgeLabsWithoutPreferences(
  db: DrizzleTransaction,
  draftId: bigint,
) {
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

    const toAcknowledge = await db
      .with(draftsCte, draftedCte, preferredCte)
      .select({
        draftId: draftsCte.draftId,
        round: draftsCte.currRound,
        labId: schema.draftLabQuota.labId,
      })
      .from(draftsCte)
      .innerJoin(schema.draftLabQuota, eq(draftsCte.draftId, schema.draftLabQuota.draftId))
      .leftJoin(draftedCte, eq(schema.draftLabQuota.labId, draftedCte.labId))
      .leftJoin(preferredCte, eq(schema.draftLabQuota.labId, preferredCte.labId))
      .where(
        or(
          gte(sql`coalesce(${draftedCte.draftees}, 0)`, schema.draftLabQuota.initialQuota),
          eq(sql`coalesce(${preferredCte.preferrers}, 0)`, 0),
        ),
      );

    for (const row of toAcknowledge)
      await db.insert(schema.facultyChoice).values(row).onConflictDoNothing();
  });
}

export async function incrementDraftRound(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('increment-draft-round', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .update(schema.draft)
      .set({
        currRound: sql`case when ${schema.draft.currRound} < ${schema.draft.maxRounds} + 1 then ${schema.draft.currRound} + 1 else ${schema.draft.currRound} end`,
      })
      .where(eq(schema.draft.id, draftId))
      .returning({
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
      })
      .then(assertOptional);
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
      .select({ pendingCount: count(schema.draftLabQuota.labId) })
      .from(schema.draftLabQuota)
      .leftJoin(subquery, eq(schema.draftLabQuota.labId, subquery.labId))
      .where(and(eq(schema.draftLabQuota.draftId, draftId), isNull(subquery.labId)))
      .then(assertSingle);
    return pendingCount;
  });
}

export async function getDraftAssignmentRecords(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-assignment-records', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const choice = alias(schema.facultyChoice, 'choice');
    const student = alias(schema.user, 'student');
    return await db
      .select({
        id: schema.facultyChoiceUser.studentUserId,
        labId: schema.facultyChoiceUser.labId,
        round: schema.facultyChoiceUser.round,
        assignedAt: choice.createdAt,
        email: student.email,
        givenName: student.givenName,
        familyName: student.familyName,
        avatarUrl: student.avatarUrl,
        studentNumber: student.studentNumber,
        labName: schema.lab.name,
      })
      .from(schema.facultyChoiceUser)
      .innerJoin(student, eq(schema.facultyChoiceUser.studentUserId, student.id))
      .innerJoin(schema.lab, eq(schema.facultyChoiceUser.labId, schema.lab.id))
      .leftJoin(
        choice,
        and(
          eq(schema.facultyChoiceUser.draftId, choice.draftId),
          eq(schema.facultyChoiceUser.labId, choice.labId),
          sql`${schema.facultyChoiceUser.round} is not distinct from ${choice.round}`,
        ),
      )
      .where(eq(schema.facultyChoiceUser.draftId, draftId))
      .orderBy(
        asc(schema.facultyChoiceUser.round),
        asc(student.familyName),
        asc(student.givenName),
      );
  });
}

export async function getUserByEmail(db: DbConnection, email: string) {
  return await tracer.asyncSpan('get-user-by-email', async span => {
    span.setAttribute('database.user.email', email);
    const { email: _, ...columns } = getTableColumns(schema.user);
    return await db
      .select(columns)
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .then(assertOptional);
  });
}
