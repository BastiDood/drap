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
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to create lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to create lab',
      );
      error(403);
    }

    const draft = await db.getActiveDraft();
    if (typeof draft !== 'undefined') {
      db.logger.error('no drafts are active');
      error(403);
    }

    const data = await request.formData();
    const id = validateString(data.get('id'));
    const lab = validateString(data.get('name'));
    db.logger.info({ id, lab }, 'creating lab');

    const insertNewLab = await db.insertNewLab(id, lab);
    db.logger.info({ insertNewLab }, 'lab created');
  },
  async quota({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to update lab quota without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to update lab quota',
      );
      error(403);
    }

    const draft = await db.getActiveDraft();
    if (typeof draft !== 'undefined' && draft.currRound !== null && draft.currRound > 0) {
      db.logger.error(
        { round: draft.currRound },
        'cannot update lab quota while a draft is ongoing',
      );
      error(403, 'It is unsafe to update the lab quota while a draft is ongoing.');
    }

    const pairs = mapRowTuples(await request.formData());
    db.logger.info({ pairs }, 'updating lab quotas in bulk');

    await db.updateLabQuotas(pairs);
    db.logger.info('lab quotas updated');
  },
  async delete({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to soft-delete lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to soft-delete lab',
      );
      error(403);
    }

    const data = await request.formData();
    const id = validateString(data.get('delete'));
    db.logger.info({ id }, 'soft-deleting lab');

    await db.deleteLab(id);
    db.logger.info('lab soft-deleted');
  },
  async restore({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to restore lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to restore lab',
      );
      error(403);
    }

    const data = await request.formData();
    const id = validateString(data.get('restore'));
    db.logger.info({ id }, 'restoring lab');

    await db.restoreLab(id);
    db.logger.info('lab restored');
  },
};
