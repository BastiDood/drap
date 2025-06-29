import { error, redirect } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

  return { labs: await db.getLabRegistry(false) };
}

function* mapRowTuples(data: FormData) {
  for (const [key, value] of data.entries()) {
    if (value instanceof File || value.length === 0) continue;
    yield [key, parseInt(value, 10)] as const;
  }
}

export const actions = {
  async lab({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const draft = await db.getActiveDraft();
    if (typeof draft !== 'undefined') error(403);

    const data = await request.formData();
    const id = validateString(data.get('id'));
    const lab = validateString(data.get('name'));
    const insertNewLab = await db.insertNewLab(id, lab);
    db.logger.info({ insertNewLab });
  },
  async quota({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const draft = await db.getActiveDraft();
    if (typeof draft !== 'undefined' && draft.currRound !== null && draft.currRound > 0)
      error(403, 'It is unsafe to update the lab quota while a draft is ongoing.');

    const data = await request.formData();
    await db.updateLabQuotas(mapRowTuples(data));
  },
  async delete({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const data = await request.formData();
    const id = validateString(data.get('delete'));

    await db.deleteLab(id);
  },
  async restore({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

    const data = await request.formData();
    const id = validateString(data.get('restore'));

    await db.restoreLab(id);
  },
};
