import Papa from 'papaparse';
import { error, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { getDraftById, getDraftResultsExport } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.results-csv';
const logger = Logger.byName(SERVICE_NAME);

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

  logger.info('exporting draft results');
  const results = await getDraftResultsExport(db, draftId);
  return new Response(Papa.unparse(results), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment',
    },
  });
}
