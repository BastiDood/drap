import { error, fail, redirect } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  const { user } = session;
  if (
    user.isAdmin ||
    user.googleUserId === null ||
    user.labId !== null ||
    user.studentNumber === null
  )
    error(403);

  const { draft } = await parent();
  const [availableLabs, rankings] = await Promise.all([
    db.getLabRegistry(),
    db.getStudentRankings(draft.id, user.id),
  ]);

  return { draft, availableLabs, rankings };
}

export const actions = {
  async default({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (
      user.isAdmin ||
      user.googleUserId === null ||
      user.labId !== null ||
      user.studentNumber === null
    )
      error(403);

    const data = await request.formData();
    const draft = BigInt(validateString(data.get('draft')));
    const labs = data.getAll('labs').map(validateString);
    const remarks = data.getAll('remarks').map(validateString);

    if (labs.length <= 0) return fail(400);

    const maxRounds = await db.getMaxRoundInDraft(draft);
    if (typeof maxRounds === 'undefined') error(404);

    if (labs.length > maxRounds) error(400);

    await db.insertStudentRanking(draft, user.id, labs, remarks);
    // TODO: Add proper logging/handling of insert errors.
  },
};
