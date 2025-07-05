import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access lab page without session');
    redirect(307, '/oauth/login/');
  }

  if (session.user.googleUserId === null || session.user.labId === null) {
    db.logger.error(
      {
        isAdmin: session.user.isAdmin,
        googleUserId: session.user.googleUserId,
        labId: session.user.labId,
      },
      'insufficient permissions to access lab page',
    );
    error(403);
  }

  const info = await db.getLabMembers(session.user.labId);
  db.logger.info(
    { labName: info.lab, headCount: info.heads.length, memberCount: info.members.length },
    'lab info fetched',
  );
  return info;
}
