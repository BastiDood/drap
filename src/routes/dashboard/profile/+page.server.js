import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import { db, updateProfileByUserId } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const ProfileFormData = v.object({
  studentNumber: v.optional(v.pipe(v.string(), v.minLength(1))),
  given: v.pipe(v.string(), v.minLength(1)),
  family: v.pipe(v.string(), v.minLength(1)),
});

const SERVICE_NAME = 'routes.profile';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access profile page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  logger.debug('profile page loaded', {
    'user.id': session.user.id,
    'user.email': session.user.email,
  });
  return { user: session.user };
}

export const actions = {
  async profile({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to update profile without session');
      error(401);
    }

    const { user } = session;
    return await tracer.asyncSpan('action.profile', async () => {
      logger.debug('updating profile request', {
        'user.id': user.id,
        'user.email': user.email,
      });

      const data = await request.formData();
      const { studentNumber, given, family } = v.parse(ProfileFormData, decode(data));
      logger.debug('updating profile', {
        'user.student_number': studentNumber,
        'user.given_name': given,
        'user.family_name': family,
      });

      await updateProfileByUserId(
        db,
        user.id,
        typeof studentNumber === 'undefined' ? null : BigInt(studentNumber),
        given,
        family,
      );
      logger.info('profile updated');
    });
  },
};
