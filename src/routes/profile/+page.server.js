import { error, redirect } from '@sveltejs/kit';

import { maybeValidateBigInt, validateString } from '$lib/forms';

export function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access profile page without session');
    redirect(307, '/oauth/login/');
  }

  db.logger.info(session.user, 'profile page loaded');
  return { user: session.user };
}

export const actions = {
  async profile({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to update profile without session');
      error(401);
    }

    db.logger.info(session.user, 'updating profile');

    const data = await request.formData();
    const studentNumber = maybeValidateBigInt(data.get('student-number'));
    const given = validateString(data.get('given'));
    const family = validateString(data.get('family'));
    db.logger.info({ studentNumber, given, family }, 'updating profile');

    await db.updateProfileByUserId(session.user.id, studentNumber, given, family);
    db.logger.info('profile updated');
  },
};
