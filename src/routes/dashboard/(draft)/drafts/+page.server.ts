import * as v from 'valibot';
import { and, asc, count, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertSingle } from '$lib/server/assert';
import { coerceDate, coerceNumber } from '$lib/coerce';
import { db } from '$lib/server/database';
import {
  type DbConnection,
  type DrizzleTransaction,
  getDrafts,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access drafts page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to access drafts page', void 0, {
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

  return await tracer.asyncSpan('load-drafts-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });

    const [drafts, draftStatsRecords] = await Promise.all([
      getDrafts(db),
      getDraftStatsRecords(db),
    ]);

    logger.debug('drafts page loaded', {
      'draft.count': drafts.length,
      'draft.stats.record_count': draftStatsRecords.length,
    });

    return { drafts, draftStatsRecords };
  });
}

const InitFormData = v.object({
  rounds: v.number(),
  closesAt: v.date(),
});

export const actions = {
  async init({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to init draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to init draft', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.init', async () => {
      const data = await request.formData();
      const { rounds, closesAt } = v.parse(
        InitFormData,
        decode(data, { numbers: ['rounds'], dates: ['closesAt'] }),
      );
      logger.debug('initializing draft', {
        'draft.round.max': rounds,
        'draft.registration.closes_at': closesAt.toISOString(),
      });

      const draft = await db.transaction(
        async db => {
          if (await hasActiveDraft(db)) {
            logger.fatal('attempt to init draft while active draft exists');
            error(409, 'An active draft already exists');
          }
          return await initDraft(db, rounds, closesAt);
        },
        { isolationLevel: 'read committed' },
      );
      logger.info('draft initialized', {
        'draft.id': draft.id.toString(),
        'draft.active_period_start': draft.activePeriodStart.toISOString(),
      });
    });
  },
};

async function hasActiveDraft(db: DbConnection) {
  return await tracer.asyncSpan('has-active-draft', async () => {
    const result = await db
      .select({ one: sql.raw('1') })
      .from(schema.draft)
      .where(isNull(sql`upper(${schema.draft.activePeriod})`))
      .limit(1)
      .then(rows => rows[0]);
    return typeof result !== 'undefined';
  });
}

async function initDraft(db: DrizzleTransaction, maxRounds: number, registrationClosedAt: Date) {
  return await tracer.asyncSpan('init-draft', async span => {
    span.setAttribute('database.draft.max_rounds', maxRounds);

    // Blocks further modifications to the lab catalog until the end of the transaction.
    await db.execute(sql`lock table ${schema.lab} in share mode`);

    const draft = await db
      .insert(schema.draft)
      .values({ maxRounds, registrationClosedAt })
      .returning({
        id: schema.draft.id,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`.mapWith(coerceDate),
      })
      .then(assertSingle);

    const labs = await db.select({ labId: schema.activeLabView.id }).from(schema.activeLabView);
    if (labs.length > 0)
      await db.insert(schema.draftLabQuota).values(
        labs.map(
          ({ labId }): Pick<schema.NewDraftLabQuota, 'draftId' | 'labId'> => ({
            draftId: draft.id,
            labId,
          }),
        ),
      );

    return draft;
  });
}

async function getDraftStatsRecords(db: DbConnection) {
  return await tracer.asyncSpan('get-draft-stats-records', async () => {
    const draftedCounts = db.$with('_drafted_counts').as(
      db
        .select({
          draftId: schema.facultyChoiceUser.draftId,
          labId: schema.facultyChoiceUser.labId,
          draftedStudents: sql`${count(schema.facultyChoiceUser.studentUserId)}`
            .mapWith(coerceNumber)
            .as('_drafted_students'),
        })
        .from(schema.facultyChoiceUser)
        .groupBy(({ draftId, labId }) => [draftId, labId]),
    );
    return await db
      .with(draftedCounts)
      .select({
        draftId: schema.draftLabQuota.draftId,
        activePeriodStart: sql`lower(${schema.draft.activePeriod})`
          .mapWith(coerceDate)
          .as('_active_period_start'),
        labId: schema.draftLabQuota.labId,
        draftedStudents: sql`coalesce(${draftedCounts.draftedStudents}, 0)`
          .mapWith(coerceNumber)
          .as('_drafted_students'),
      })
      .from(schema.draftLabQuota)
      .innerJoin(schema.draft, eq(schema.draftLabQuota.draftId, schema.draft.id))
      .leftJoin(
        draftedCounts,
        and(
          eq(schema.draftLabQuota.draftId, draftedCounts.draftId),
          eq(schema.draftLabQuota.labId, draftedCounts.labId),
        ),
      )
      .where(isNotNull(sql`upper(${schema.draft.activePeriod})`))
      .orderBy(({ activePeriodStart, labId }) => [asc(activePeriodStart), asc(labId)]);
  });
}
