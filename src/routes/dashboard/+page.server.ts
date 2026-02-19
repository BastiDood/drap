import { AssertionError } from 'node:assert/strict';

import * as v from 'valibot';
import { DatabaseError } from 'pg';
import { decode } from 'decode-formdata';
import { DrizzleQueryError } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { dev } from '$app/environment';
import type { DraftConcludedEvent } from '$lib/server/inngest/schema';
import {
  getLabById,
  getUserNameByEmail,
  impersonateUserBySessionId,
  insertDummySession,
  updateProfileByUserId,
  updateSessionUserId,
  updateUserRole,
  upsertOpenIdUser,
} from '$lib/server/database/drizzle';
import { inngest } from '$lib/server/inngest/client';
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

const LotteryAssignmentFormData = v.object({
  labId: v.pipe(v.string(), v.minLength(1)),
  studentEmail: v.pipe(v.string(), v.email()),
});

const SendEmailFormData = v.variant('event', [
  v.object({
    event: v.literal('draft/round.started'),
    draftId: v.number(),
    round: v.optional(v.nullable(v.number()), null),
    recipientEmail: v.string(),
  }),
  v.object({
    event: v.literal('draft/round.submitted'),
    draftId: v.number(),
    round: v.number(),
    labId: v.string(),
    recipientEmail: v.string(),
  }),
  v.object({
    event: v.literal('draft/lottery.intervened'),
    draftId: v.number(),
    labId: v.string(),
    studentEmail: v.string(),
    recipientEmail: v.string(),
  }),
  v.object({
    event: v.literal('draft/draft.concluded'),
    draftId: v.number(),
    recipientEmail: v.string(),
    lotteryAssignments: v.optional(v.array(LotteryAssignmentFormData), []),
  }),
  v.object({
    event: v.literal('draft/user.assigned'),
    labId: v.string(),
    userEmail: v.string(),
  }),
]);

const DevUserFormData = v.object({
  userEmail: v.string(),
});

type DevRoleFormOutput = v.InferOutput<typeof DevRoleFormData>;
type DevDummyFormOutput = v.InferOutput<typeof DevDummyFormData>;
type SendEmailFormOutput = v.InferOutput<typeof SendEmailFormData>;
type DevUserFormOutput = v.InferOutput<typeof DevUserFormData>;

export const actions = {
  async profile({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to update profile without session');
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
              logger.fatal('attempt to change role without session');
              error(401);
            }

            const data = await request.formData();
            // eslint-disable-next-line @typescript-eslint/init-declarations
            let parsed: DevRoleFormOutput;
            try {
              parsed = v.parse(DevRoleFormData, decode(data, { booleans: ['isAdmin'] }));
            } catch (err) {
              if (v.isValiError(err)) {
                logger.fatal('invalid input provided for role update', err);
                return fail(422);
              }
              throw err;
            }

            const { isAdmin, labId } = parsed;
            const normalizedLabId = labId || null;

            const { user } = session;
            span.setAttributes({
              'user.id': user.id,
              'user.is_admin': isAdmin,
            });
            if (normalizedLabId !== null) span.setAttribute('user.lab_id', normalizedLabId);

            try {
              await updateUserRole(db, user.id, isAdmin, normalizedLabId);
            } catch (err) {
              if (
                err instanceof DrizzleQueryError &&
                err.cause instanceof DatabaseError &&
                err.cause.code === '23503'
              ) {
                logger.fatal('invalid lab id', err);
                return fail(404);
              }
              throw err;
            }

            logger.info('user role updated');
            redirect(303, '/dashboard/');
          });
        },
        async dummy({ cookies, locals: { session }, request }) {
          return await tracer.asyncSpan('action.dummy', async span => {
            const data = await request.formData();
            // eslint-disable-next-line @typescript-eslint/init-declarations
            let parsed: DevDummyFormOutput;
            try {
              parsed = v.parse(DevDummyFormData, decode(data));
            } catch (err) {
              if (v.isValiError(err)) {
                logger.fatal('dummy user creation failed due to invalid input', err);
                return fail(422);
              }
              throw err;
            }

            const { email, givenName, familyName } = parsed;
            const userId = crypto.randomUUID();
            span.setAttributes({
              'user.id': userId,
              'user.email': email,
              'user.given_name': givenName,
              'user.family_name': familyName,
            });

            await db.transaction(
              async db => {
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
              },
              { isolationLevel: 'repeatable read' },
            );

            redirect(303, '/dashboard/');
          });
        },
        async email({ locals: { session }, request }) {
          return await tracer.asyncSpan('action.email', async () => {
            if (typeof session?.user === 'undefined') {
              logger.fatal('attempt to dispatch email without session');
              error(401);
            }

            const data = await request.formData();
            const decoded = decode(data, {
              arrays: ['lotteryAssignments'],
              numbers: ['draftId', 'round'],
            });

            // eslint-disable-next-line @typescript-eslint/init-declarations
            let parsed: SendEmailFormOutput;
            try {
              parsed = v.parse(SendEmailFormData, decoded);
            } catch (err) {
              if (v.isValiError(err)) {
                logger.fatal('email dispatch failed due to invalid input', err);
                return fail(422);
              }
              throw err;
            }

            logger.info('dispatching email event...');
            switch (parsed.event) {
              case 'draft/round.started': {
                /* eslint-disable @typescript-eslint/init-declarations */
                let givenName: string;
                let familyName: string;
                /* eslint-enable @typescript-eslint/init-declarations */
                try {
                  ({ givenName, familyName } = await getUserNameByEmail(db, parsed.recipientEmail));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown recipient email', err);
                    return fail(404, 'Recipient email is not a user in the database.');
                  }
                  throw err;
                }
                await inngest.send({
                  name: parsed.event,
                  data: {
                    draftId: parsed.draftId,
                    round: parsed.round,
                    recipientEmail: parsed.recipientEmail,
                    recipientName: `${givenName} ${familyName}`,
                  },
                });
                break;
              }
              case 'draft/round.submitted': {
                // eslint-disable-next-line @typescript-eslint/init-declarations
                let labName: string;
                try {
                  ({ name: labName } = await getLabById(db, parsed.labId));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown lab id', err);
                    return fail(404, 'Lab is not found in the database.');
                  }
                  throw err;
                }
                await inngest.send({
                  name: parsed.event,
                  data: {
                    draftId: parsed.draftId,
                    round: parsed.round,
                    labId: parsed.labId,
                    labName,
                    recipientEmail: parsed.recipientEmail,
                  },
                });
                break;
              }
              case 'draft/lottery.intervened': {
                // eslint-disable-next-line @typescript-eslint/init-declarations
                let labName: string;
                try {
                  ({ name: labName } = await getLabById(db, parsed.labId));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown lab id', err);
                    return fail(404, 'Lab is not found in the database.');
                  }
                  throw err;
                }

                /* eslint-disable @typescript-eslint/init-declarations */
                let studentGivenName: string;
                let studentFamilyName: string;
                /* eslint-enable @typescript-eslint/init-declarations */
                try {
                  ({ givenName: studentGivenName, familyName: studentFamilyName } =
                    await getUserNameByEmail(db, parsed.studentEmail));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown student email', err);
                    return fail(404, 'Student email is not a user in the database.');
                  }
                  throw err;
                }

                /* eslint-disable @typescript-eslint/init-declarations */
                let recipientGivenName: string;
                let recipientFamilyName: string;
                /* eslint-enable @typescript-eslint/init-declarations */
                try {
                  ({ givenName: recipientGivenName, familyName: recipientFamilyName } =
                    await getUserNameByEmail(db, parsed.recipientEmail));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown recipient email', err);
                    return fail(404, 'Recipient email is not a user in the database.');
                  }
                  throw err;
                }

                await inngest.send({
                  name: parsed.event,
                  data: {
                    draftId: parsed.draftId,
                    labId: parsed.labId,
                    labName,
                    studentName: `${studentGivenName} ${studentFamilyName}`,
                    studentEmail: parsed.studentEmail,
                    recipientEmail: parsed.recipientEmail,
                    recipientName: `${recipientGivenName} ${recipientFamilyName}`,
                  },
                });
                break;
              }
              case 'draft/draft.concluded': {
                /* eslint-disable @typescript-eslint/init-declarations */
                let givenName: string;
                let familyName: string;
                /* eslint-enable @typescript-eslint/init-declarations */
                try {
                  ({ givenName, familyName } = await getUserNameByEmail(db, parsed.recipientEmail));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown recipient email', err);
                    return fail(404, 'Recipient email is not a user in the database.');
                  }
                  throw err;
                }

                const lotteryAssignments: DraftConcludedEvent['lotteryAssignments'] = [];
                for (const { labId, studentEmail } of parsed.lotteryAssignments) {
                  // eslint-disable-next-line @typescript-eslint/init-declarations
                  let labName: string;
                  try {
                    ({ name: labName } = await getLabById(db, labId));
                  } catch (err) {
                    if (err instanceof AssertionError) {
                      logger.fatal('unknown lab id', err);
                      return fail(404, `${labId.toUpperCase()} is not found in the database.`);
                    }
                    throw err;
                  }

                  /* eslint-disable @typescript-eslint/init-declarations */
                  let studentGivenName: string;
                  let studentFamilyName: string;
                  /* eslint-enable @typescript-eslint/init-declarations */
                  try {
                    ({ givenName: studentGivenName, familyName: studentFamilyName } =
                      await getUserNameByEmail(db, studentEmail));
                  } catch (err) {
                    if (err instanceof AssertionError) {
                      logger.fatal('unknown student email', err);
                      return fail(404, `${studentEmail} is not a user in the database.`);
                    }
                    throw err;
                  }

                  lotteryAssignments.push({
                    labId,
                    labName,
                    studentName: `${studentGivenName} ${studentFamilyName}`,
                    studentEmail,
                  });
                }

                await inngest.send({
                  name: parsed.event,
                  data: {
                    draftId: parsed.draftId,
                    recipientEmail: parsed.recipientEmail,
                    recipientName: `${givenName} ${familyName}`,
                    lotteryAssignments,
                  },
                });
                break;
              }
              case 'draft/user.assigned': {
                // eslint-disable-next-line @typescript-eslint/init-declarations
                let labName: string;
                try {
                  ({ name: labName } = await getLabById(db, parsed.labId));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown lab id', err);
                    return fail(404, 'Lab is not found in the database.');
                  }
                  throw err;
                }

                /* eslint-disable @typescript-eslint/init-declarations */
                let userGivenName: string;
                let userFamilyName: string;
                /* eslint-enable @typescript-eslint/init-declarations */
                try {
                  ({ givenName: userGivenName, familyName: userFamilyName } =
                    await getUserNameByEmail(db, parsed.userEmail));
                } catch (err) {
                  if (err instanceof AssertionError) {
                    logger.fatal('unknown user email', err);
                    return fail(404, 'User email is not a user in the database.');
                  }
                  throw err;
                }

                await inngest.send({
                  name: parsed.event,
                  data: {
                    labId: parsed.labId,
                    labName,
                    userEmail: parsed.userEmail,
                    userName: `${userGivenName} ${userFamilyName}`,
                  },
                });
                break;
              }
              default:
                throw new Error('unreachable email event case');
            }
          });
        },
        async user({ locals: { session }, request }) {
          return await tracer.asyncSpan('action.user', async span => {
            if (typeof session?.user === 'undefined') {
              logger.fatal('attempt to switch to another user without session');
              error(401);
            }

            const data = await request.formData();
            // eslint-disable-next-line @typescript-eslint/init-declarations
            let parsed: DevUserFormOutput;
            try {
              parsed = v.parse(DevUserFormData, decode(data));
            } catch (err) {
              if (v.isValiError(err)) {
                logger.fatal('user switch failed due to invalid input', err, {
                  'user.id': session.user.id,
                });
                return fail(422);
              }
              throw err;
            }

            const { userEmail } = parsed;
            const { user } = session;
            span.setAttributes({
              'user.id': user.id,
              'user.email': userEmail,
            });

            // Switch user via session ID
            const id = await impersonateUserBySessionId(db, session.id, userEmail);
            if (id === null) {
              logger.warn('failed to switch to another user');
              return fail(404);
            }

            logger.info('user switched', { 'session.id': session.id });
            redirect(303, '/dashboard/');
          });
        },
      }
    : {}),
};
