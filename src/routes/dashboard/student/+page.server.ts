import { error, fail, redirect } from '@sveltejs/kit';

import {
  db,
  getActiveDraft,
  getDraftById,
  getLabRegistry,
  getStudentRankings,
  insertStudentRanking,
  updateProfileByUserId,
} from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { maybeValidateBigInt, validateMaybeEmptyString, validateString } from '$lib/forms';
import { Tracer } from '$lib/server/telemetry/tracer';

import type { PageServerLoadEvent, RequestEvent } from './$types';

const SERVICE_NAME = 'routes.dashboard.student';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }: PageServerLoadEvent) {
  if (!session?.user) {
    logger.warn('attempt to access student dashboard without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;

  // Only students allowed (not admin, no lab assignment)
  if (user.isAdmin || user.labId !== null) {
    logger.warn('non-student attempting to access student dashboard', {
      'user.id': user.id,
      'user.is_admin': user.isAdmin,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  logger.debug('student dashboard loaded', {
    'user.id': user.id,
    'user.email': user.email,
  });

  // Build base user object
  const baseUser = {
    id: user.id,
    email: user.email,
    givenName: user.givenName,
    familyName: user.familyName,
    avatarUrl: user.avatarUrl,
    studentNumber: user.studentNumber,
  };

  // PROFILE_SETUP: studentNumber is null
  if (user.studentNumber === null) {
    logger.debug('user needs profile setup');
    return { user: baseUser };
  }

  // Check for active draft
  const draft = await getActiveDraft(db);

  // NO_DRAFT: no active draft
  if (!draft) {
    logger.debug('no active draft');
    return { user: baseUser };
  }

  const { id: draftId, currRound, maxRounds, registrationClosesAt } = draft;
  logger.debug('active draft found', {
    'draft.id': draftId.toString(),
    'draft.curr_round': currRound,
    'draft.max_rounds': maxRounds,
  });

  // LOTTERY: currRound is null (lottery phase)
  if (currRound === null) {
    logger.debug('draft in lottery phase');
    return {
      user: baseUser,
      draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
    };
  }

  // Check if user has submitted rankings
  const rankings = await getStudentRankings(db, draftId, user.id);

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
      };
    }

    // Registration closed but currRound still 0 (waiting for draft to start)
    // REGISTRATION_CLOSED: user missed registration
    logger.debug('registration closed, user missed registration');
    return {
      user: baseUser,
      draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
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
    };
  }

  // REGISTRATION_CLOSED: user didn't submit and draft already started
  logger.debug('draft in progress, user missed registration');
  return {
    user: baseUser,
    draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
  };
}

export const actions = {
  async profile({ locals: { session }, request }: RequestEvent) {
    if (!session?.user) {
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
      const studentNumber = maybeValidateBigInt(data.get('student-number'));
      const given = validateString(data.get('given'));
      const family = validateString(data.get('family'));
      logger.debug('updating profile', {
        'user.student_number': studentNumber?.toString(),
        'user.given_name': given,
        'user.family_name': family,
      });

      await updateProfileByUserId(db, user.id, studentNumber, given, family);
      logger.info('profile updated');
    });
  },

  async submit({ locals: { session }, request }: RequestEvent) {
    if (!session?.user) {
      logger.warn('attempt to submit lab rankings without session');
      error(401);
    }

    const { user } = session;
    if (
      user.isAdmin ||
      user.googleUserId === null ||
      user.labId !== null ||
      user.studentNumber === null
    ) {
      logger.warn('insufficient permissions to submit lab rankings', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
        'user.student_number': user.studentNumber?.toString(),
      });
      error(403);
    }

    return await tracer.asyncSpan('action.submit', async () => {
      const data = await request.formData();
      const draftId = BigInt(validateString(data.get('draft')));
      const labs = data.getAll('labs').map(validateString);
      const remarks = data.getAll('remarks').map(validateMaybeEmptyString);
      logger.debug('lab rankings submitted', {
        'draft.id': draftId.toString(),
        'ranking.lab_count': labs.length,
        'ranking.remarks_count': remarks.length,
      });

      if (labs.length <= 0) {
        logger.warn('no lab rankings submitted');
        return fail(400);
      }

      const draft = await getDraftById(db, draftId);
      if (!draft) {
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
