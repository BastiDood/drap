import Papa from 'papaparse';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { array, parse, string } from 'valibot';
import { error, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateBigInt } from '$lib/validators';

const tracer = Tracer.byName('routes.dashboard.admin.drafts.system-logs-csv');

const SERVICE_NAME = 'routes.dashboard.admin.drafts.system-logs-csv';
const logger = Logger.byName(SERVICE_NAME);

function determineAction(userEmail: string | null, studentEmails: string[]): string {
  if (userEmail === null) return 'System automation triggered.';
  if (studentEmails.length === 0) return 'No students selected.';
  return 'Students selected.';
}

type SystemLogsExport = Awaited<ReturnType<typeof getSystemLogsExport>>;
function formatSystemLogForCsv({
  createdAt,
  draftId,
  round,
  userId,
  labId,
  userEmail,
  studentEmails,
}: SystemLogsExport[number]) {
  return {
    createdAt,
    draftId: Number(draftId),
    round: round === null ? 'Lottery' : round,
    labId,
    userId,
    userEmail,
    studentEmails: studentEmails.join(','),
    action: determineAction(userEmail, studentEmails),
  };
}

export async function GET({ params: { draftId: draftIdParam }, locals: { session } }) {
  const draftId = validateBigInt(draftIdParam);
  if (draftId === null) {
    logger.fatal('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    logger.error('attempt to export system logs without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to export system logs', void 0, {
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

  logger.info('exporting system logs');
  const records = await getSystemLogsExport(db, draftId);
  const csvData = records.map(formatSystemLogForCsv);
  return new Response(Papa.unparse(csvData), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment',
    },
  });
}

async function getSystemLogsExport(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-system-logs-export', async span => {
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
        studentEmails:
          sql`coalesce(array_agg(${studentUser.email}) filter (where ${studentUser.email} is not null), '{}')`.mapWith(
            vals => parse(array(string()), vals),
          ),
      })
      .from(schema.facultyChoice)
      .leftJoin(facultyUser, eq(schema.facultyChoice.userId, facultyUser.id))
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.facultyChoice.draftId, schema.facultyChoiceUser.draftId),
          eq(schema.facultyChoice.labId, schema.facultyChoiceUser.labId),
          sql`${schema.facultyChoice.round} is not distinct from ${schema.facultyChoiceUser.round}`,
        ),
      )
      .leftJoin(studentUser, eq(schema.facultyChoiceUser.studentUserId, studentUser.id))
      .where(eq(schema.facultyChoice.draftId, draftId))
      .groupBy(
        schema.facultyChoice.draftId,
        schema.facultyChoice.round,
        schema.facultyChoice.labId,
        schema.facultyChoice.createdAt,
        schema.facultyChoice.userId,
        facultyUser.email,
      )
      .orderBy(
        desc(schema.facultyChoice.createdAt),
        sql`${schema.facultyChoice.round} desc nulls first`,
        asc(schema.facultyChoice.labId),
      );
  });
}
