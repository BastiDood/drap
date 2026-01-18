import { error, redirect } from '@sveltejs/kit';

import {
  db,
  deleteLab,
  getActiveDraft,
  getLabRegistry,
  insertNewLab,
  restoreLab,
  updateLabQuotas,
} from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.admin.labs';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) error(403);

  return { labs: await getLabRegistry(db, false) };
}

function* mapRowTuples(data: FormData) {
  for (const [key, value] of data.entries()) {
    if (value instanceof File || value.length === 0) continue;
    yield [key, parseInt(value, 10)] as const;
  }
}

export const actions = {
  async lab({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to create lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to create lab', void 0, {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const draft = await getActiveDraft(db);
    if (typeof draft !== 'undefined') {
      logger.error('no drafts are active');
      error(403);
    }

    const data = await request.formData();
    const id = validateString(data.get('id'));
    const lab = validateString(data.get('name'));
    logger.info('creating lab', { id, lab });

    await insertNewLab(db, id, lab);
    logger.info('lab created', { id, lab });
  },
  async quota({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to update lab quota without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to update lab quota', void 0, {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const draft = await getActiveDraft(db);
    if (typeof draft !== 'undefined' && draft.currRound !== null && draft.currRound > 0) {
      logger.error('cannot update lab quota while a draft is ongoing', void 0, {
        'draft.round.current': draft.currRound,
      });
      error(403, 'It is unsafe to update the lab quota while a draft is ongoing.');
    }

    const pairs = mapRowTuples(await request.formData());
    await updateLabQuotas(db, pairs);
    logger.info('lab quotas updated');
  },
  async delete({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to soft-delete lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to soft-delete lab', void 0, {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const data = await request.formData();
    const id = validateString(data.get('delete'));
    logger.info('soft-deleting lab', { id });

    await deleteLab(db, id);
    logger.info('lab soft-deleted');
  },
  async restore({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to restore lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to restore lab', void 0, {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const data = await request.formData();
    const id = validateString(data.get('restore'));
    logger.info('restoring lab', { id });

    await restoreLab(db, id);
    logger.info('lab restored');
  },
};
