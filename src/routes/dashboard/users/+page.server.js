import { error, fail } from '@sveltejs/kit';
import { validateEmail, validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
  const { user } = await parent();
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);
  const [labs, faculty] = await Promise.all([db.getLabRegistry(), db.getFacultyAndStaff()]);
  return { labs, faculty };
}

export const actions = {
  async admin({ locals: { db }, cookies, request }) {
    const sid = cookies.get('sid');
    if (typeof sid === 'undefined') error(401);

    const user = await db.getUserFromValidSession(sid);
    if (typeof user === 'undefined') error(401);
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const data = await request.formData();
    const email = validateEmail(data.get('email'));
    if (await db.inviteNewFacultyOrStaff(email, null)) return;
    return fail(409);
  },
  async faculty({ locals: { db }, cookies, request }) {
    const sid = cookies.get('sid');
    if (typeof sid === 'undefined') error(401);

    const user = await db.getUserFromValidSession(sid);
    if (typeof user === 'undefined') error(401);
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const data = await request.formData();
    const email = validateEmail(data.get('email'));
    const lab = validateString(data.get('invite'));
    if (await db.inviteNewFacultyOrStaff(email, lab)) return;
    return fail(409);
  },
};
