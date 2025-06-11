import { error, fail, redirect } from '@sveltejs/kit';
import { validateEmail, validateString } from '$lib/forms';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
    error(403);

  const [labs, faculty] = await Promise.all([db.getLabRegistry(), db.getFacultyAndStaff()]);
  return { labs, faculty };
}

export const actions = {
  async admin({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
      error(403);

    const data = await request.formData();
    const email = validateEmail(data.get('email'));
    if (await db.inviteNewFacultyOrStaff(email, null)) return;
    return fail(409);
  },
  async faculty({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
      error(403);

    const data = await request.formData();
    const email = validateEmail(data.get('email'));
    const lab = validateString(data.get('invite'));
    if (await db.inviteNewFacultyOrStaff(email, lab)) return;
    return fail(409);
  },
};
