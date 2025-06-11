import { error, redirect } from '@sveltejs/kit';
import { maybeValidateBigInt, validateString } from '$lib/forms';

export function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');
  return { user: session.user };
}

export const actions = {
  async profile({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const data = await request.formData();
    const studentNumber = maybeValidateBigInt(data.get('student-number'));
    const given = validateString(data.get('given'));
    const family = validateString(data.get('family'));

    return await db.updateProfileByUserId(session.user.id, studentNumber, given, family);
  },
};
