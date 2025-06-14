import assert, { fail, strictEqual } from 'node:assert/strict';

import { and, count, countDistinct, desc, eq, gte, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { Logger } from 'pino';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';
import { type Loggable, timed } from './decorators';
import { alias } from 'drizzle-orm/pg-core';

function init(url: string) {
  return drizzle(url, { schema });
}

function assertOptional<T>([result, ...rest]: T[]) {
  strictEqual(rest.length, 0, 'too many results');
  return result;
}

function assertSingle<T>(results: T[]) {
  const result = assertOptional(results);
  assert(typeof result !== 'undefined', 'missing result');
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coerceDate(value: any) {
  return new Date(value);
}

// Ensures that no database details are leaked at runtime.
export type { schema };

export type DrizzleDatabase = ReturnType<typeof init>;
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0];

export class Database implements Loggable {
  #logger: Logger;
  #db: DrizzleDatabase | DrizzleTransaction;

  private constructor(db: DrizzleDatabase | DrizzleTransaction, logger: Logger) {
    this.#logger = logger;
    this.#db = db;
  }

  static fromUrl(url: string, logger: Logger) {
    return new Database(init(url), logger);
  }

  get logger() {
    return this.#logger;
  }

  /** Begins a transaction. */
  begin<T>(fn: (db: Database) => Promise<T>) {
    return this.#db.transaction(tx => fn(new Database(tx, this.#logger)));
  }

  @timed async generatePendingSession(hasExtendedScope: boolean) {
    return await this.#db
      .insert(schema.pending)
      .values({ hasExtendedScope })
      .returning({
        id: schema.pending.id,
        expiration: schema.pending.expiration,
        nonce: schema.pending.nonce,
      })
      .then(assertSingle);
  }

  @timed async deletePendingSession(id: string) {
    return await this.#db
      .delete(schema.pending)
      .where(eq(schema.pending.id, id))
      .returning({
        id: schema.pending.id,
        expiration: schema.pending.expiration,
        nonce: schema.pending.nonce,
        hasExtendedScope: schema.pending.hasExtendedScope,
      })
      .then(assertOptional);
  }

  @timed async insertDummySession(dummyUserId: string) {
    // create a session that expires after an hour
    const { sessionId } = await this.#db
      .insert(schema.session)
      .values({ userId: dummyUserId, expiration: new Date(Date.now() + 3600000) })
      .returning({ sessionId: schema.session.id })
      .then(assertSingle);
    return sessionId;
  }

  @timed async insertValidSession(id: string, userId: string, expiration: Date) {
    const { rowCount } = await this.#db.insert(schema.session).values({ id, userId, expiration });
    strictEqual(rowCount, 1, 'only one session must be inserted');
  }

  @timed async getUserFromValidSession(sid: string) {
    const result = await this.#db.query.session.findFirst({
      columns: {},
      with: { user: true },
      where: ({ id }, { eq }) => eq(id, sid),
    });
    return result?.user;
  }

  @timed async deleteValidSession(sid: string) {
    return await this.#db
      .delete(schema.session)
      .where(eq(schema.session.id, sid))
      .returning({
        userId: schema.session.userId,
        expiration: schema.session.expiration,
      })
      .then(assertOptional);
  }

  @timed async initUser(email: string) {
    const { id } = await this.#db
      .insert(schema.user)
      .values({ email })
      .onConflictDoUpdate({
        target: schema.user.email,
        set: { email: sql`excluded.${sql.raw(schema.user.email.name)}` },
      })
      .returning({ id: schema.user.id })
      .then(assertSingle);
    return id;
  }

  @timed async upsertOpenIdUser(
    email: string,
    uid: string,
    given: string,
    family: string,
    avatar: string,
  ) {
    return await this.#db
      .insert(schema.user)
      .values({ email, googleUserId: uid, givenName: given, familyName: family, avatarUrl: avatar })
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
  }

  @timed async updateProfileByUserId(
    uid: string,
    studentNumber: bigint | null,
    given: string,
    family: string,
  ) {
    await this.#db
      .update(schema.user)
      .set({
        studentNumber: sql`coalesce(${schema.user.studentNumber}, ${studentNumber})`,
        givenName: given,
        familyName: family,
      })
      .where(and(eq(schema.user.id, uid)));
  }

  @timed async insertNewLab(id: string, name: string) {
    await this.#db.insert(schema.lab).values({ id, name });
  }

  @timed async getLabRegistry() {
    return await this.#db.query.lab.findMany({
      columns: { id: true, name: true, quota: true },
      orderBy: ({ name }) => name,
    });
  }

  @timed async isValidTotalLabQuota() {
    const { result } = await this.#db
      .select({ result: sql`bool_or(${schema.lab.quota} > 0)`.mapWith(Boolean) })
      .from(schema.lab)
      .then(assertSingle);
    return result;
  }

  @timed async getLabCount() {
    const { result } = await this.#db
      .select({ result: count(schema.lab.id) })
      .from(schema.lab)
      .then(assertSingle);
    return result;
  }

  @timed async getStudentCountInDraft(id: bigint) {
    const { result } = await this.#db
      .select({ result: count(schema.studentRank.userId) })
      .from(schema.studentRank)
      .where(eq(schema.studentRank.draftId, id))
      .then(assertSingle);
    return result;
  }

  /** @deprecated Internally uses a `for` loop. */
  @timed async updateLabQuotas(quotas: Iterable<readonly [string, number]>) {
    for (const [id, quota] of quotas)
      await this.#db.update(schema.lab).set({ quota }).where(eq(schema.lab.id, id));
  }

  @timed async getFacultyAndStaff() {
    return await this.#db
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
  }

  @timed async getValidStaffEmails() {
    const results = await this.#db
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
  }

  /** Ideally invoked from within a transaction. */
  @timed async getLabMembers(labId: string) {
    const labInfo = await this.#db.query.lab.findFirst({
      columns: { name: true },
      where: ({ id }) => eq(id, labId),
    });

    const heads = await this.#db.query.user.findMany({
      columns: {
        email: true,
        givenName: true,
        familyName: true,
        avatarUrl: true,
        studentNumber: true,
      },
      where: and(
        isNotNull(schema.user.id),
        eq(schema.user.labId, labId),
        eq(schema.user.isAdmin, true),
      ),
      orderBy: ({ familyName }) => familyName,
    });

    const members = await this.#db.query.user.findMany({
      columns: {
        email: true,
        givenName: true,
        familyName: true,
        avatarUrl: true,
        studentNumber: true,
      },
      where: and(
        isNotNull(schema.user.id),
        eq(schema.user.labId, labId),
        eq(schema.user.isAdmin, false),
      ),
      orderBy: ({ familyName }) => familyName,
    });

    return { lab: labInfo?.name, heads, members };
  }

  @timed async getDrafts() {
    return await this.#db
      .select({
        id: schema.draft.id,
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate).as('_'),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .from(schema.draft)
      .orderBy(({ activePeriodStart }) => sql`${desc(activePeriodStart)} NULLS FIRST`);
  }

  @timed async getDraftById(id: bigint) {
    return await this.#db
      .select({
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .from(schema.draft)
      .where(eq(schema.draft.id, id))
      .then(assertOptional);
  }

  @timed async getActiveDraft() {
    return await this.#db
      .select({
        id: schema.draft.id,
        currRound: schema.draft.currRound,
        maxRounds: schema.draft.maxRounds,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
        activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .from(schema.draft)
      .where(sql`upper_inf(${schema.draft.activePeriod})`)
      .then(assertOptional);
  }

  @timed async getMaxRoundInDraft(draftId: bigint) {
    const result = await this.#db
      .select({ maxRounds: schema.draft.maxRounds })
      .from(schema.draft)
      .where(eq(schema.draft.id, draftId))
      .then(assertOptional);
    return result?.maxRounds;
  }

  @timed async getStudentsInDraftTaggedByLab(draftId: bigint) {
    return await this.#db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
        studentNumber: schema.user.studentNumber,
        labs: sql<
          string[]
        >`array_agg(${schema.studentRankLab.labId} ORDER BY ${schema.studentRankLab.index})`.as(
          'labs',
        ),
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
      .groupBy(
        schema.user.id,
        schema.user.email,
        schema.user.givenName,
        schema.user.familyName,
        schema.user.avatarUrl,
        schema.user.studentNumber,
        schema.facultyChoiceUser.labId,
      )
      .orderBy(schema.user.familyName);
  }

  /**
   * Typically invoked from within a transaction.
   *
   * For a lab to be auto-acknowledged:
   * 1. The lab has exhausted their entire quota (i.e., no remaining quota).
   * 2. The lab must not be preferred by anyone in the current draft round.
   */
  @timed async getLabAndRemainingStudentsInDraftWithLabPreference(draftId: bigint, labId: string) {
    const labInfo = await this.#db.query.lab.findFirst({
      columns: { name: true, quota: true },
      where: ({ id }) => eq(id, labId),
    });

    const students = await this.#db
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
      );

    const researchers = await this.#db
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

    const chosen = await this.#db
      .select({ createdAt: schema.facultyChoice.createdAt })
      .from(schema.facultyChoice)
      .innerJoin(
        schema.draft,
        and(
          eq(schema.facultyChoice.draftId, schema.draft.id),
          eq(schema.facultyChoice.round, schema.draft.currRound),
        ),
      )
      .where(and(eq(schema.facultyChoice.draftId, draftId), eq(schema.facultyChoice.labId, labId)));

    return { lab: labInfo, students, researchers, isDone: chosen.length > 0 };
  }

  /** Typically invoked from within a transaction. */
  @timed async autoAcknowledgeLabsWithoutPreferences(draftId: bigint) {
    // Define the draft CTE
    const draftsCte = this.#db
      .$with('_drafts')
      .as(
        this.#db
          .select({ draftId: schema.draft.id, currRound: schema.draft.currRound })
          .from(schema.draft)
          .where(eq(schema.draft.id, draftId)),
      );

    // Define the drafted students CTE
    const draftedCte = this.#db.$with('_drafted').as(
      this.#db
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
    const preferredSubquery = this.#db
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
    const preferredCte = this.#db.$with('_preferred').as(
      this.#db
        .select({
          labId: preferredSubquery.labId,
          preferrers: countDistinct(preferredSubquery.studentUserId).as('preferrers'),
        })
        .from(preferredSubquery)
        .groupBy(preferredSubquery.labId),
    );

    await this.#db.transaction(async txn => {
      const toAcknowledge = await txn
        .with(draftsCte, draftedCte, preferredCte)
        .select({ draftId: draftsCte.draftId, round: draftsCte.currRound, labId: schema.lab.id })
        .from(draftsCte)
        .crossJoin(schema.lab)
        .leftJoin(draftedCte, eq(schema.lab.id, draftedCte.labId))
        .leftJoin(preferredCte, eq(schema.lab.id, preferredCte.labId))
        .where(
          or(
            gte(sql`coalesce(${draftedCte.draftees}, 0)`, schema.lab.quota),
            eq(sql`coalesce(${preferredCte.preferrers}, 0)`, 0),
          ),
        );

      for (const row of toAcknowledge) await txn.insert(schema.facultyChoice).values(row);
    });
  }

  @timed async getLabQuotaAndSelectedStudentCountInDraft(did: bigint, lid: string) {
    const labInfo = await this.#db.query.lab.findFirst({
      columns: { quota: true },
      where: ({ id }, { eq }) => eq(id, lid),
    });

    const draftCount = await this.#db
      .select({ studentCount: count(schema.facultyChoiceUser.studentUserId) })
      .from(schema.facultyChoiceUser)
      .where(
        and(eq(schema.facultyChoiceUser.draftId, did), eq(schema.facultyChoiceUser.labId, lid)),
      )
      .then(assertSingle);

    return {
      quota: labInfo?.quota,
      selected: draftCount.studentCount,
    };
  }

  @timed async initDraft(maxRounds: number) {
    return await this.#db
      .insert(schema.draft)
      .values({ maxRounds })
      .returning({
        id: schema.draft.id,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .then(assertSingle);
  }

  @timed async incrementDraftRound(draftId: bigint) {
    return await this.#db
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
  }

  @timed async randomizeRemainingStudents(draftId: bigint) {
    const results = await this.#db
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
  }

  @timed async concludeDraft(draftId: bigint) {
    const { activePeriodEnd } = await this.#db
      .update(schema.draft)
      .set({
        activePeriod: sql`tstzrange(lower(${schema.draft.activePeriod}), coalesce(upper(${schema.draft.activePeriod}), now()), '[)')`,
      })
      .where(eq(schema.draft.id, draftId))
      .returning({ activePeriodEnd: sql`upper(${schema.draft.activePeriod})`.mapWith(coerceDate) })
      .then(assertSingle);
    return activePeriodEnd;
  }

  @timed async insertStudentRanking(
    draftId: bigint,
    userId: string,
    labs: string[],
    remarks: string[],
  ) {
    await this.#db.transaction(async txn => {
      await txn
        .insert(schema.studentRank)
        .values({ draftId, userId })
        .onConflictDoNothing({ target: [schema.studentRank.draftId, schema.studentRank.userId] });

      for (let idx = 0; idx < labs.length; idx++) {
        const labId = labs[idx];
        const remark = remarks[idx];
        const index = BigInt(idx + 1);

        if (labId && typeof remark !== 'undefined')
          await txn.insert(schema.studentRankLab).values({ draftId, userId, labId, index, remark });
      }
    });
  }

  @timed async getStudentRankings(draftId: bigint, userId: string) {
    const sub = this.#db
      .select({
        createdAt: schema.studentRank.createdAt,
        idx: sql`unnest(array_agg(${schema.studentRankLab.index}))`.as('sub_idx'),
        labId: sql`unnest(array_agg(${schema.studentRankLab.labId}))`.as('sub_lab_id'),
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
      .groupBy(schema.studentRank.createdAt, schema.studentRank.draftId, schema.studentRank.userId)
      .as('_');

    return await this.#db
      .select({
        createdAt: sub.createdAt,
        labs: sql<string[]>`array_agg(${schema.lab.name} ORDER BY ${sub.idx})`,
      })
      .from(sub)
      .innerJoin(schema.lab, eq(sub.labId, schema.lab.id))
      .groupBy(sub.createdAt)
      .then(assertOptional);
  }

  @timed async getCandidateSenders() {
    return await this.#db
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
  }

  /**
   * A designated sender is an admin (i.e., `is_admin=True` and `lab_id=NULL`) with valid
   * OAuth 2.0 credentials such that the access token will not expire in the next five minutes.
   */
  @timed async getDesignatedSenderCredentials() {
    return await this.#db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        accessToken: schema.candidateSender.accessToken,
        refreshToken: schema.candidateSender.refreshToken,
        expiration: schema.candidateSender.expiration,
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
      .then(assertOptional);
  }

  @timed async upsertCandidateSender(
    userId: string,
    expiration: Date,
    accessToken: string,
    refreshToken?: string,
  ) {
    const query =
      typeof refreshToken === 'undefined'
        ? this.#db
            .update(schema.candidateSender)
            .set({ expiration, accessToken })
            .where(eq(schema.candidateSender.userId, userId))
        : this.#db
            .insert(schema.candidateSender)
            .values({ userId, expiration, accessToken, refreshToken })
            .onConflictDoUpdate({
              target: schema.candidateSender.userId,
              set: {
                expiration: sql`excluded.${sql.raw(schema.candidateSender.expiration.name)}`,
                accessToken: sql`excluded.${sql.raw(schema.candidateSender.accessToken.name)}`,
                refreshToken: sql`excluded.${sql.raw(schema.candidateSender.refreshToken.name)}`,
              },
            });
    const { rowCount } = await query;
    switch (rowCount) {
      case 1:
        return;
      default:
        fail(`upsertCandidateSender => unexpected insertion count ${rowCount}`);
    }
  }

  @timed async deleteCandidateSender(userId: string) {
    const { rowCount } = await this.#db
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
  }

  @timed async deleteDesignatedSender(userId: string) {
    const { rowCount } = await this.#db
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
  }

  @timed async upsertDesignatedSender(userId: string) {
    const { rowCount } = await this.#db
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
  }

  /**
   * Typically invoked from within a transaction.
   *
   * The operation of inserting a faculty choice must necessarily occur
   * with the updating of a student_rank entry's chosen_by field; note
   * the two return values for this function.
   *
   * @deprecated This is due for a refactor.
   */
  @timed async insertFacultyChoice(
    draftId: bigint,
    labId: string,
    facultyUserId: string,
    studentUserIds: string[],
  ) {
    const draft = await this.#db.query.draft.findFirst({
      columns: { currRound: true },
      where: ({ id }, { eq }) => eq(id, draftId),
    });
    if (typeof draft === 'undefined') return;

    const { rowCount: facultyChoiceRowCount } = await this.#db
      .insert(schema.facultyChoice)
      .values({ draftId, round: draft.currRound, labId, userId: facultyUserId });
    strictEqual(
      facultyChoiceRowCount,
      1,
      'insertFacultyChoice::facultyChoice => unexpected insertion count',
    );

    if (studentUserIds.length === 0) return;

    const { rowCount: facultyChoiceUserRowCount } = await this.#db
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

  /** Typically invoked from within a transaction. */
  @timed async insertLotteryChoices(
    draftId: bigint,
    adminUserId: string,
    assignmentUserIdToLabPairs: (readonly [string, string])[],
  ) {
    const draft = await this.#db.query.draft.findFirst({
      columns: { currRound: true },
      where: ({ id }, { eq }) => eq(id, draftId),
    });
    if (typeof draft === 'undefined') return;

    const labs = await this.#db.query.lab.findMany({ columns: { id: true } });
    if (labs.length === 0) return;

    await this.#db
      .insert(schema.facultyChoice)
      .values(
        labs.map(
          ({ id }) =>
            ({
              draftId,
              round: draft.currRound,
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

    if (assignmentUserIdToLabPairs.length === 0) return;

    await this.#db.insert(schema.facultyChoiceUser).values(
      assignmentUserIdToLabPairs.map(
        ([studentUserId, labId]) =>
          ({
            facultyUserId: adminUserId,
            studentUserId,
            draftId,
            round: draft.currRound,
            labId,
          }) satisfies schema.NewFacultyChoiceUser,
      ),
    );
  }

  @timed async getPendingLabCountInDraft(draftId: bigint) {
    const subquery = this.#db
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
    const { pendingCount } = await this.#db
      .select({ pendingCount: count(schema.lab.id) })
      .from(schema.lab)
      .leftJoin(subquery, eq(schema.lab.id, subquery.labId))
      .where(isNull(subquery.labId))
      .then(assertSingle);
    return pendingCount;
  }

  @timed async getFacultyChoiceRecords(draftId: bigint) {
    const facultyUser = alias(schema.user, 'faculty_user');
    const studentUser = alias(schema.user, 'student_user');
    return await this.#db
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
      .innerJoin(facultyUser, eq(schema.facultyChoice.userId, facultyUser.id))
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.facultyChoice.draftId, schema.facultyChoiceUser.draftId),
          eq(schema.facultyChoice.round, schema.facultyChoiceUser.round),
          eq(schema.facultyChoice.labId, schema.facultyChoiceUser.labId),
        ),
      )
      .innerJoin(studentUser, eq(schema.facultyChoiceUser.studentUserId, studentUser.id))
      .where(eq(schema.facultyChoice.draftId, draftId))
      .orderBy(schema.facultyChoice.round);
  }

  @timed async getDraftEvents(draftId: bigint) {
    return await this.#db
      .select({
        createdAt: schema.facultyChoice.createdAt,
        round: schema.facultyChoice.round,
        labId: schema.facultyChoice.labId,
        isSystem: isNull(schema.facultyChoice.userId),
      })
      .from(schema.facultyChoice)
      .where(eq(schema.facultyChoice.draftId, draftId))
      .orderBy(desc(schema.facultyChoice.createdAt));
  }

  @timed async inviteNewFacultyOrStaff(email: string, labId: string | null) {
    const { rowCount } = await this.#db
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
  }
}
