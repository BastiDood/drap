import { and, asc, count, eq, isNotNull, lte, sql } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertSingle } from '$lib/server/assert';
import { coerceNumber } from '$lib/coerce';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.interventions-aggregate';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch interventions aggregate without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch interventions aggregate', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-interventions-aggregate', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const aggregate = await db.transaction(
      async db => {
        const draft = await getDraftById(db, draftId);
        if (typeof draft === 'undefined') {
          logger.fatal('draft not found', void 0, { 'draft.id': draftId.toString() });
          error(404);
        }

        return await getInterventionsAggregate(
          db,
          draftId,
          draft.maxRounds,
          await getStudentCountInDraft(db, draftId),
        );
      },
      { isolationLevel: 'repeatable read' },
    );

    logger.debug('interventions aggregate fetched', { 'draft.id': draftId.toString() });
    return json(aggregate);
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
