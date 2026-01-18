import { error, redirect } from '@sveltejs/kit';

import { db, updateProfileByUserId } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { maybeValidateBigInt, validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.profile';
const logger = Logger.byName(SERVICE_NAME);

export function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access profile page without session');
    redirect(307, '/oauth/login/');
  }

  logger.info('profile page loaded', { 'user.id': session.user.id, 'user.email': session.user.email });
  return { user: session.user };
}

export const actions = {
  async profile({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to update profile without session');
      error(401);
    }

    logger.info('updating profile request', { 'user.id': session.user.id, 'user.email': session.user.email });

    const data = await request.formData();
    const studentNumber = maybeValidateBigInt(data.get('student-number'));
    const given = validateString(data.get('given'));
    const family = validateString(data.get('family'));
    logger.info('updating profile', { 'user.student_number': studentNumber?.toString(), 'user.given_name': given, 'user.family_name': family });

    await updateProfileByUserId(db, session.user.id, studentNumber, given, family);
    logger.info('profile updated');
  },
};
