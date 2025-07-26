import { error, redirect } from '@sveltejs/kit';
import Papa from 'papaparse';

import { validateBigInt } from '$lib/validators';

export async function GET({ params: { draftId }, locals: { db, session } }) {
  const did = validateBigInt(draftId);

  if (did === null) {
    db.logger.error('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to export draft results without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    db.logger.error(
      { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
      'insufficient permissions to export draft results',
    );
    error(403);
  }

  const draft = await db.getDraftById(did);
  if (typeof draft === 'undefined') {
    db.logger.error('cannot find the target draft');
    error(404);
  }

  db.logger.info('exporting draft results');
  const results = await db.getDraftResultsExport(did);
  return new Response(Papa.unparse(results), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment',
    },
  });
}
