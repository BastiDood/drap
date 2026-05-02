import Papa from 'papaparse';
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import { array, parse, string } from 'valibot';
import { error, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.students-csv';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params: { draftId: draftIdParam }, locals: { session } }) {
  const draftId = validateBigInt(draftIdParam);
  if (draftId === null) {
    logger.fatal('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    logger.error('attempt to export student ranks without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to export student ranks', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const draft = await getDraftById(db, draftId);
  if (typeof draft === 'undefined') {
    logger.fatal('cannot find the target draft');
    error(404);
  }

  logger.info('exporting student ranks');
  const studentRanks = await getStudentRanksExport(db, draftId);
  return new Response(Papa.unparse(studentRanks), {
    headers: {
      'Content-Type': 'application/csv',
      'Content-Disposition': 'attachment',
    },
  });
}

async function getStudentRanksExport(db: DbConnection, draftId: bigint) {
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
          sql`coalesce(array_agg(${schema.studentRankLab.labId} ORDER BY ${schema.studentRankLab.index}) filter (where ${isNotNull(schema.studentRankLab.labId)}), '{}')`.mapWith(
            vals => parse(array(string()), vals),
          ),
      })
      .from(schema.studentRank)
      .innerJoin(schema.user, eq(schema.studentRank.userId, schema.user.id))
      .leftJoin(
        schema.studentRankLab,
        and(
          eq(schema.studentRank.draftId, schema.studentRankLab.draftId),
          eq(schema.studentRank.userId, schema.studentRankLab.userId),
        ),
      )
      .where(eq(schema.studentRank.draftId, draftId))
      .groupBy(schema.user.id, schema.studentRank.createdAt)
      .orderBy(asc(schema.studentRank.createdAt));
  });
}
