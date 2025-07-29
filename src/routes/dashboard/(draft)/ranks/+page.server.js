import { error, fail, redirect } from '@sveltejs/kit';

import { validateMaybeEmptyString, validateString } from '$lib/forms';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access ranks page without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (
    user.isAdmin ||
    user.googleUserId === null ||
    user.labId !== null ||
    user.studentNumber === null
  ) {
    db.logger.error(
      {
        isAdmin: user.isAdmin,
        googleUserId: user.googleUserId,
        labId: user.labId,
        studentNumber: user.studentNumber,
      },
      'insufficient permissions to access ranks page',
    );
    error(403);
  }

  const { draft } = await parent();
  const [rankings, availableLabs] = await Promise.all([
    db.getStudentRankings(draft.id, user.id),
    db.getLabRegistry(true),
  ]);

  if (typeof rankings === 'undefined') db.logger.warn('no rankings submitted yet');
  else
    db.logger.info(
      { rankingsLabCount: rankings.labRemarks.length },
      'rankings previously submitted',
    );

  db.logger.trace({ availableLabCount: availableLabs.length }, 'available labs fetched');

  return { draft, availableLabs, rankings };
}

export const actions = {
  async default({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to submit lab rankings without session');
      error(401);
    }

    const { user } = session;
    if (
      user.isAdmin ||
      user.googleUserId === null ||
      user.labId !== null ||
      user.studentNumber === null
    ) {
      db.logger.error(
        {
          isAdmin: user.isAdmin,
          googleUserId: user.googleUserId,
          labId: user.labId,
          studentNumber: user.studentNumber,
        },
        'insufficient permissions to submit lab rankings',
      );
      error(403);
    }

    const data = await request.formData();
    const draftId = BigInt(validateString(data.get('draft')));
    const labs = data.getAll('labs').map(validateString);
    const remarks = data.getAll('remarks').map(validateMaybeEmptyString);
    db.logger.info(
      { draftId, labCount: labs.length, remarksCount: remarks.length },
      'lab rankings submitted',
    );

    if (labs.length <= 0) {
      db.logger.error('no lab rankings submitted');
      return fail(400);
    }

    const draft = await db.getDraftById(draftId);
    if (typeof draft === 'undefined') {
      db.logger.error('cannot find the target draft');
      error(404);
    }

    const { currRound, maxRounds } = draft;
    db.logger.info({ maxRounds }, 'max rounds for target draft determined');
    if (currRound !== 0) {
      db.logger.error(draft, 'cannot submit rankings to an ongoing draft')
      error(403);
    }

    if (labs.length > maxRounds) {
      db.logger.error({ labCount: labs.length }, 'lab rankings exceed max round');
      error(400);
    }

    await db.insertStudentRanking(draftId, user.id, labs, remarks);
    db.logger.info('lab rankings inserted');
    // TODO: Add proper logging/handling of insert errors.
  },
};
