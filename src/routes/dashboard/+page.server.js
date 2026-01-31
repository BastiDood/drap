import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import {
  db,
  insertDummySession,
  updateProfileByUserId,
  updateSessionUserId,
  updateUserRole,
  upsertOpenIdUser,
} from '$lib/server/database';
import { dev } from '$app/environment';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.index';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access dashboard without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  logger.debug('redirecting user to role-specific home', {
    'user.id': user.id,
    'user.is_admin': user.isAdmin,
    'user.lab_id': user.labId,
  });

  if (user.isAdmin) {
    if (user.labId === null) redirect(307, '/dashboard/drafts/'); // admin
    redirect(307, '/dashboard/lab/'); // faculty
  }

  if (user.labId === null) redirect(307, '/dashboard/student/'); // student
  redirect(307, '/dashboard/lab/'); // researcher
}

const ProfileFormData = v.object({
  studentNumber: v.optional(v.pipe(v.string(), v.minLength(1))),
  given: v.pipe(v.string(), v.minLength(1)),
  family: v.pipe(v.string(), v.minLength(1)),
});

const DevRoleFormData = v.object({
  isAdmin: v.boolean(),
  labId: v.optional(v.string()),
});

const DevDummyFormData = v.object({
  email: v.pipe(v.string(), v.email()),
  givenName: v.pipe(v.string(), v.minLength(1)),
  familyName: v.pipe(v.string(), v.minLength(1)),
});

export const actions = {
  async profile({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to update profile without session');
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
  ...(dev
    ? {
        async role({ locals: { session }, request }) {
          return await tracer.asyncSpan('action.role', async span => {
            if (typeof session?.user === 'undefined') {
              logger.warn('attempt to change role without session');
              error(401);
            }

            const data = await request.formData();
            const { isAdmin, labId } = v.parse(
              DevRoleFormData,
              decode(data, { booleans: ['isAdmin'] }),
            );

            const { user } = session;
            span.setAttributes({
              'user.id': user.id,
              'user.is_admin': isAdmin,
              'user.lab_id': labId,
            });

            await updateUserRole(db, user.id, isAdmin, labId || null);
            logger.info('user role updated');

            redirect(303, '/dashboard/');
          });
        },
        async dummy({ cookies, locals: { session }, request }) {
          return await tracer.asyncSpan('action.dummy', async span => {
            const data = await request.formData();
            const { email, givenName, familyName } = v.parse(DevDummyFormData, decode(data));
            const userId = crypto.randomUUID();
            span.setAttributes({
              'user.id': userId,
              'user.email': email,
              'user.given_name': givenName,
              'user.family_name': familyName,
            });

            const dummyUser = await upsertOpenIdUser(
              db,
              email,
              userId, // HACK: this is not a valid Google account identifier.
              givenName,
              familyName,
              `https://avatar.vercel.sh/${userId}.svg`,
            );
            logger.info('dummy user inserted', dummyUser);

            // Create new session if not logged in, otherwise swap session user
            if (typeof session === 'undefined') {
              const dummySessionId = await insertDummySession(db, dummyUser.id);
              cookies.set('sid', dummySessionId, {
                path: '/dashboard',
                httpOnly: true,
                sameSite: 'lax',
              });
              logger.info('dummy session created', { 'session.id': dummySessionId });
            } else {
              await updateSessionUserId(db, session.id, dummyUser.id);
              logger.warn('dummy session swapped', { 'session.id': session.id });
            }

            redirect(303, '/dashboard/');
          });
        },
      }
    : null),
};
