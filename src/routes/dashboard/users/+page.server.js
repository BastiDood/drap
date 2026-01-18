import { error, fail, redirect } from '@sveltejs/kit';

import {
  db,
  getFacultyAndStaff,
  getLabRegistry,
  inviteNewFacultyOrStaff,
} from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateEmail, validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.users';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access users page without session');
    redirect(307, '/oauth/login/');
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    logger.warn('insufficient permissions to access users page', {
      'auth.user.is_admin': session.user.isAdmin,
      'auth.user.google_id': session.user.googleUserId,
      'user.lab_id': session.user.labId,
    });
    error(403);
  }

  const [labs, faculty] = await Promise.all([getLabRegistry(db), getFacultyAndStaff(db)]);
  logger.debug('users page loaded', {
    'lab.count': labs.length,
    'user.faculty_count': faculty.length,
  });
  return { labs, faculty };
}

export const actions = {
  async admin({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to invite user without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.warn('insufficient permissions to invite user', {
        'auth.user.is_admin': session.user.isAdmin,
        'auth.user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.admin', async () => {
      const data = await request.formData();
      const email = validateEmail(data.get('email'));
      logger.debug('inviting new admin', { email });

      if (await inviteNewFacultyOrStaff(db, email, null)) {
        logger.info('new admin invited');
        return;
      }

      logger.warn('admin email was already invited before');
      return fail(409);
    });
  },
  async faculty({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to invite faculty without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.warn('insufficient permissions to invite faculty', {
        'auth.user.is_admin': session.user.isAdmin,
        'auth.user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.faculty', async () => {
      const data = await request.formData();
      const email = validateEmail(data.get('email'));
      const lab = validateString(data.get('invite'));
      logger.debug('inviting new faculty', { email, lab });

      if (await inviteNewFacultyOrStaff(db, email, lab)) {
        logger.info('new faculty invited');
        return;
      }

      logger.warn('faculty email was already invited before');
      return fail(409);
    });
  },
};
