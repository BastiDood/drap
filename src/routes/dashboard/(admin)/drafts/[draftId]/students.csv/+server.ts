import Papa from 'papaparse';
import { error, redirect } from '@sveltejs/kit';

import { validateBigInt } from '$lib/validators.js';

export async function GET({ params: { draftId }, locals: { db, session } }) {
  const did = validateBigInt(draftId);

  if (did === null) {
    db.logger.error('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to export student ranks without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    db.logger.error(
      { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
      'insufficient permissions to export student ranks',
    );
    error(403);
  }

  const draft = await db.getDraftById(did);
  if (typeof draft === 'undefined') {
    db.logger.error('cannot find the target draft');
    error(404);
  }

  db.logger.info('exporting student ranks');
  const studentRanks = await db.getStudentRanksExport(did);

  return new Response(Papa.unparse(studentRanks), {
    headers: {
      'Content-Type': 'application/csv',
      'Content-Disposition': 'attachment',
    },
  });
}
