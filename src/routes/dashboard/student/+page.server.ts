import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, fail, redirect } from '@sveltejs/kit';

import {
  db,
  getActiveDraft,
  getDraftById,
  getLabById,
  getLabRegistry,
  getStudentRankings,
  insertStudentRanking,
  type schema,
  updateProfileByUserId,
} from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import type { PageServerLoadEvent, RequestEvent } from './$types';

const ProfileFormData = v.object({
  studentNumber: v.optional(v.pipe(v.string(), v.minLength(1))),
  given: v.pipe(v.string(), v.minLength(1)),
  family: v.pipe(v.string(), v.minLength(1)),
});

const SubmitFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
  labs: v.array(v.pipe(v.string(), v.minLength(1))),
  remarks: v.array(v.string()),
});

const SERVICE_NAME = 'routes.dashboard.student';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }: PageServerLoadEvent) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access student dashboard without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { id: sessionId, user } = session;

  // Only students allowed (not admin)
  if (user.isAdmin) {
    logger.error('admin attempting to access student dashboard', void 0, {
      'user.id': user.id,
      'user.is_admin': user.isAdmin,
    });
    error(403);
  }

  const {
    id: userId,
    email: userEmail,
    givenName,
    familyName,
    avatarUrl,
    studentNumber,
    labId,
  } = user;

  return await tracer.asyncSpan('load-student-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'session.user.email': userEmail,
    });

    logger.debug('student dashboard loaded', {
      'user.id': userId,
      'user.email': userEmail,
    });

    // Build base user object
    const baseUser = {
      id: userId,
      email: userEmail,
      givenName,
      familyName,
      avatarUrl,
      studentNumber,
    };

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let lab: Pick<schema.Lab, 'name'> | undefined;
    if (labId !== null) lab = await getLabById(db, labId);

    if (studentNumber === null) {
      logger.debug('user needs profile setup');
      return { user: baseUser, lab };
    }

    // Check for active draft
    const draft = await getActiveDraft(db);

    // NO_DRAFT: no active draft
    if (!draft) {
      logger.debug('no active draft');
      return { user: baseUser, lab };
    }

    const { id: draftId, currRound, maxRounds, registrationClosesAt } = draft;
    logger.debug('active draft found', {
      'draft.id': draftId.toString(),
      'draft.round.current': currRound,
      'draft.round.max': maxRounds,
    });

    // LOTTERY: currRound is null (lottery phase)
    if (currRound === null) {
      logger.debug('draft in lottery phase');
      return {
        user: baseUser,
        draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
        lab,
      };
    }

    // Check if user has submitted rankings
    const rankings = await getStudentRankings(db, draftId, userId);

    const requestedAt = new Date();

    function buildSubmission(r: NonNullable<typeof rankings>) {
      return {
        createdAt: r.createdAt,
        labs: r.labRemarks.map(({ lab, remark }) => ({
          id: lab,
          name: lab,
          remark,
        })),
      };
    }

    // Registration phase (currRound === 0)
    if (currRound === 0) {
      if (rankings) {
        // SUBMITTED: user already submitted during registration
        logger.debug('user already submitted rankings');
        return {
          user: baseUser,
          draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
          submission: buildSubmission(rankings),
          lab,
        };
      }

      // Check if registration is still open
      if (requestedAt < registrationClosesAt) {
        // REGISTRATION_OPEN: registration still open
        logger.debug('registration open');
        const availableLabs = await getLabRegistry(db, true);
        return {
          user: baseUser,
          draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
          availableLabs: availableLabs.map(({ id, name }) => ({ id, name })),
          lab,
        };
      }

      // Registration closed but currRound still 0 (waiting for draft to start)
      // REGISTRATION_CLOSED: user missed registration
      logger.debug('registration closed, user missed registration');
      return {
        user: baseUser,
        draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
        lab,
      };
    }

    // Draft in progress (currRound > 0)
    if (rankings) {
      // DRAFT_IN_PROGRESS: user submitted and draft is ongoing
      logger.debug('draft in progress, user submitted');
      return {
        user: baseUser,
        draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
        submission: buildSubmission(rankings),
        lab,
      };
    }

    // REGISTRATION_CLOSED: user didn't submit and draft already started
    logger.debug('draft in progress, user missed registration');
    return {
      user: baseUser,
      draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
      lab,
    };
  });
}

export const actions = {
  async profile({ locals: { session }, request }: RequestEvent) {
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

  async submit({ locals: { session }, request }: RequestEvent) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to submit lab rankings without session');
      error(401);
    }

    const { user } = session;
    if (
      user.isAdmin ||
      user.googleUserId === null ||
      user.labId !== null ||
      user.studentNumber === null
    ) {
      logger.error('insufficient permissions to submit lab rankings', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
        'user.student_number': user.studentNumber?.toString(),
      });
      error(403);
    }

    return await tracer.asyncSpan('action.submit', async () => {
      const data = await request.formData();
      const {
        draft: draftIdField,
        labs,
        remarks,
      } = v.parse(SubmitFormData, decode(data, { arrays: ['labs', 'remarks'] }));

      logger.debug('lab rankings submitted', {
        'draft.id': draftIdField,
        'ranking.lab_count': labs.length,
        'ranking.remarks_count': remarks.length,
      });

      if (labs.length <= 0) {
        logger.warn('no lab rankings submitted');
        return fail(400);
      }

      const draftId = BigInt(draftIdField);
      const draft = await getDraftById(db, draftId);
      if (typeof draft === 'undefined') {
        logger.warn('cannot find the target draft');
        error(404);
      }

      const { currRound, maxRounds, registrationClosesAt } = draft;
      logger.debug('max rounds for target draft determined', { 'draft.round.max': maxRounds });
      if (currRound !== 0) {
        logger.warn('cannot submit rankings to an ongoing draft', {
          'draft.round.current': currRound,
          'draft.round.max': maxRounds,
        });
        error(403);
      }

      if (registrationClosesAt < new Date()) {
        logger.warn('attempt to submit rankings after registration closed', {
          'draft.registration.closes_at': registrationClosesAt.toISOString(),
        });
        error(403);
      }

      if (labs.length > maxRounds) {
        logger.warn('lab rankings exceed max round', { 'ranking.lab_count': labs.length });
        error(400);
      }

      await insertStudentRanking(db, draftId, user.id, labs, remarks);
      logger.info('lab rankings inserted');
    });
  },
};
