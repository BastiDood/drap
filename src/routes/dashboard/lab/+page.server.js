import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  if (session.user.googleUserId === null || session.user.labId === null) error(403);

  return await db.getLabMembers(session.user.labId);
}
