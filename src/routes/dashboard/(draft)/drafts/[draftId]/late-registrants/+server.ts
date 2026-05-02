import * as devalue from 'devalue';
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { array, parse, string } from 'valibot';
import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import type { DbConnection } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.late-registrants';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch late registrants without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch late registrants', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-late-registrants', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const lateRegistrants = await getLateRegistrantsByDraft(db, draftId);

    logger.debug('late registrants fetched', {
      'draft.id': draftId.toString(),
      'draft.late_registrants.count': lateRegistrants.length,
    });

    return new Response(devalue.stringify(lateRegistrants), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function getLateRegistrantsByDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-late-registrants-by-draft', async span => {
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
      .innerJoin(schema.draft, eq(schema.studentRank.draftId, schema.draft.id))
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
      .where(
        and(
          eq(schema.studentRank.draftId, draftId),
          lt(schema.draft.registrationClosedAt, schema.studentRank.createdAt),
        ),
      )
      .groupBy(schema.user.id, schema.facultyChoiceUser.labId)
      .orderBy(schema.user.familyName);
  });
}
