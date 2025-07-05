import { error, fail, redirect } from '@sveltejs/kit';
import { validateEmail, validateString } from '$lib/forms';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access users page without session');
    redirect(307, '/oauth/login/');
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    db.logger.error(
      {
        isAdmin: session.user.isAdmin,
        googleUserId: session.user.googleUserId,
        labId: session.user.labId,
      },
      'insufficient permissions to access users page',
    );
    error(403);
  }

  const [labs, faculty] = await Promise.all([db.getLabRegistry(), db.getFacultyAndStaff()]);
  db.logger.info({ labCount: labs.length, facultyCount: faculty.length }, 'users page loaded');
  return { labs, faculty };
}

export const actions = {
  async admin({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to invite user without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      db.logger.error(
        {
          isAdmin: session.user.isAdmin,
          googleUserId: session.user.googleUserId,
          labId: session.user.labId,
        },
        'insufficient permissions to invite user',
      );
      error(403);
    }

    const data = await request.formData();
    const email = validateEmail(data.get('email'));
    db.logger.info({ email }, 'inviting new admin');

    if (await db.inviteNewFacultyOrStaff(email, null)) {
      db.logger.info('new admin invited');
      return;
    }

    db.logger.warn('admin email was already invited before');
    return fail(409);
  },
  async faculty({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to invite faculty without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      db.logger.error(
        {
          isAdmin: session.user.isAdmin,
          googleUserId: session.user.googleUserId,
          labId: session.user.labId,
        },
        'insufficient permissions to invite faculty',
      );
      error(403);
    }

    const data = await request.formData();
    const email = validateEmail(data.get('email'));
    const lab = validateString(data.get('invite'));
    db.logger.info({ email, lab }, 'inviting new faculty');

    if (await db.inviteNewFacultyOrStaff(email, lab)) {
      db.logger.info('new faculty invited');
      return;
    }

    db.logger.warn('faculty email was already invited before');
    return fail(409);
  },
};
