import { error, fail } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db }, parent }) {
  const { user, draft } = await parent();
  if (
    user.isAdmin ||
    user.googleUserId === null ||
    user.labId !== null ||
    user.studentNumber === null
  )
    error(403);
  const [availableLabs, rankings] = await Promise.all([
    db.getLabRegistry(),
    db.getStudentRankings(draft.id, user.id),
  ]);
  return { draft, availableLabs, rankings };
}

export const actions = {
  async default({ locals: { db }, cookies, request }) {
    const sid = cookies.get('sid');
    if (typeof sid === 'undefined') error(401);

    const user = await db.getUserFromValidSession(sid);
    if (typeof user === 'undefined') error(401);
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
    if (labs.length <= 0) return fail(400);

    const maxRounds = await db.getMaxRoundInDraft(draft);
    if (typeof maxRounds === 'undefined') error(404);
    if (labs.length > maxRounds) error(400);

    if (await db.insertStudentRanking(draft, user.email, labs)) return;
    return fail(403);
  },
};
