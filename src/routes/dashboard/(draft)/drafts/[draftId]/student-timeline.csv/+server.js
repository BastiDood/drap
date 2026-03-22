import Papa from 'papaparse';
import { error, redirect } from '@sveltejs/kit';
import { lightFormat } from 'date-fns';
import { TZDate } from '@date-fns/tz';

import { db } from '$lib/server/database';
import {
  getDraftById,
  getStudentRanksTimelineExport,
  getStudentRegistrationTimelineExport,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.student-timeline-csv';
const logger = Logger.byName(SERVICE_NAME);

export async function GET({ params: { draftId: draftIdParam }, locals: { session } }) {
  const draftId = validateBigInt(draftIdParam);
  if (draftId === null) {
    logger.fatal('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    logger.error('attempt to export student timeline without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to export student timeline', void 0, {
      isAdmin: user.isAdmin,
      googleUserId: user.googleUserId,
      labId: user.labId,
    });
    error(403);
  }

  const draft = await getDraftById(db, draftId);
  if (typeof draft === 'undefined') {
    logger.fatal('cannot find the target draft');
    error(404);
  }

  logger.info('exporting student timeline');
  const [studentRegistrationTimeline, studentRanksTimeline] = await Promise.all([
    getStudentRegistrationTimelineExport(db, draftId),
    getStudentRanksTimelineExport(db, draftId),
  ]);

  const studentRegistrationTimelineWithAction = studentRegistrationTimeline.map(row => ({
    ...row,
    action: 'registration',
  }));
  const studentRanksTimelineWithAction = studentRanksTimeline.map(row => ({
    ...row,
    action: 'preference submission',
  }));

  const results = [
    ...studentRegistrationTimelineWithAction,
    ...studentRanksTimelineWithAction,
  ].sort((prev, next) => prev.createdAt.getTime() - next.createdAt.getTime());

  const philippineTime = new TZDate(new Date(), 'Asia/Manila');
  const now = lightFormat(philippineTime, 'yyyy-MM-dd');
  return new Response(Papa.unparse(results), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${now}_${draftId}_student-timeline.csv"`,
    },
  });
}
