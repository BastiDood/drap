import { error, fail, redirect } from '@sveltejs/kit';

import {
  db,
  getDraftById,
  getLabRegistry,
  getStudentRankings,
  insertStudentRanking,
} from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { validateMaybeEmptyString, validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.draft.ranks';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ locals: { session }, parent }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access ranks page without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (
    user.isAdmin ||
    user.googleUserId === null ||
    user.labId !== null ||
    user.studentNumber === null
  ) {
    logger.error('insufficient permissions to access ranks page', void 0, {
      'auth.user.is_admin': user.isAdmin,
      'auth.user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
      'user.student_number': user.studentNumber?.toString(),
    });
    error(403);
  }

  const { draft } = await parent();
  const [rankings, availableLabs] = await Promise.all([
    getStudentRankings(db, draft.id, user.id),
    getLabRegistry(db, true),
  ]);

  if (typeof rankings === 'undefined') logger.warn('no rankings submitted yet');
  else
    logger.info('rankings previously submitted', {
      'ranking.lab_count': rankings.labRemarks.length,
    });

  logger.trace('available labs fetched', { 'lab.available_count': availableLabs.length });

  const requestedAt = new Date();

  return { draft, availableLabs, rankings, requestedAt };
}

export const actions = {
  async default({ locals: { session }, request }) {
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
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
        'user.student_number': user.studentNumber?.toString(),
      });
      error(403);
    }

    const data = await request.formData();
    const draftId = BigInt(validateString(data.get('draft')));
    const labs = data.getAll('labs').map(validateString);
    const remarks = data.getAll('remarks').map(validateMaybeEmptyString);
    logger.info('lab rankings submitted', {
      'draft.id': draftId.toString(),
      'ranking.lab_count': labs.length,
      'ranking.remarks_count': remarks.length,
    });

    if (labs.length <= 0) {
      logger.error('no lab rankings submitted');
      return fail(400);
    }

    const draft = await getDraftById(db, draftId);
    if (typeof draft === 'undefined') {
      logger.error('cannot find the target draft');
      error(404);
    }

    const { currRound, maxRounds, registrationClosesAt } = draft;
    logger.info('max rounds for target draft determined', { 'draft.round.max': maxRounds });
    if (currRound !== 0) {
      logger.error('cannot submit rankings to an ongoing draft', void 0, { 'draft.round.current': currRound, 'draft.round.max': maxRounds });
      error(403);
    }

    if (registrationClosesAt < new Date()) {
      logger.error('attempt to submit rankings after registration closed', void 0, {
        'draft.registration.closes_at': registrationClosesAt.toISOString(),
      });
      error(403);
    }

    if (labs.length > maxRounds) {
      logger.error('lab rankings exceed max round', void 0, { 'ranking.lab_count': labs.length });
      error(400);
    }

    await insertStudentRanking(db, draftId, user.id, labs, remarks);
    logger.info('lab rankings inserted');
    // TODO: Add proper logging/handling of insert errors.
  },
};
