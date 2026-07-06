import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertSingle } from '$lib/server/assert';
import { buildLotteryAggregate } from '$lib/features/drafts/timeline/aggregates/builders';
import { coerceNullableNumber, coerceNumber } from '$lib/coerce';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.lottery-aggregate';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch lottery aggregate without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch lottery aggregate', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-lottery-aggregate', async span => {
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

        return buildLotteryAggregate(
          await getLotteryOutcomePerLab(db, draftId),
          await getLotteryStatCards(db, draftId),
        );
      },
      { isolationLevel: 'repeatable read' },
    );

    logger.debug('lottery aggregate fetched', { 'draft.id': draftId.toString() });
    return json(aggregate);
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
