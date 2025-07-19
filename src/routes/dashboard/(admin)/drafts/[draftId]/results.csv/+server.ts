import { error, redirect } from '@sveltejs/kit';
import Papa from 'papaparse';

export async function GET({ params: { draftId }, locals: { db, session } }) {
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

  const drafts = await db.getDrafts();
  if (!drafts.some(draft => draft.id === BigInt(draftId))) {
    db.logger.error('cannot find the target draft');
    error(404);
  }

  db.logger.info('exporting draft results');
  const draftResults = await db.getDraftResultsExport(BigInt(draftId));

  return new Response(Papa.unparse(draftResults), {
    headers: {
      'Content-Type': 'application/csv',
    },
  });
}
