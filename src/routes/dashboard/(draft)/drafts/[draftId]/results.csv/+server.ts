import Papa from 'papaparse';
import { alias } from 'drizzle-orm/pg-core';
import { asc, eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.results-csv';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params: { draftId: draftIdParam }, locals: { session } }) {
  const draftId = validateBigInt(draftIdParam);
  if (draftId === null) {
    logger.fatal('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    logger.error('attempt to export draft results without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to export draft results', void 0, {
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

  logger.info('exporting draft results');
  const results = await getDraftResultsExport(db, draftId);
  return new Response(Papa.unparse(results), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment',
    },
  });
}

async function getDraftResultsExport(db: DbConnection, draftId: bigint) {
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
