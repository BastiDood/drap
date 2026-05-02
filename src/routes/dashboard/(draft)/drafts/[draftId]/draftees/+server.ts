import * as devalue from 'devalue';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { array, parse, string } from 'valibot';
import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import type { DbConnection } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.draftees';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch draftee list without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch draftee list', void 0, {
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

  return await tracer.asyncSpan('fetch-draftee-list', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const draftees = await getStudentsInDraftTaggedByLab(db, draftId);

    logger.debug('draftees fetched', {
      'draft.id': draftId.toString(),
      'draftees.count': draftees.length,
    });

    return new Response(devalue.stringify(draftees), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function getStudentsInDraftTaggedByLab(db: DbConnection, draftId: bigint) {
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
        labs: sql`coalesce(array_agg(${schema.studentRankLab.labId} order by ${schema.studentRankLab.index}) filter (where ${isNotNull(schema.studentRankLab.labId)}), '{}')`
          .mapWith(value => parse(array(string()), value))
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
      .leftJoin(
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
