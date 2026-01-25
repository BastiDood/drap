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
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.admin.labs';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/dashboard/oauth/login');

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
      logger.warn('attempt to create lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to create lab', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const draft = await getActiveDraft(db);
    if (typeof draft !== 'undefined') {
      logger.warn('cannot create lab while draft is active');
      error(403);
    }

    return await tracer.asyncSpan('action.lab', async () => {
      const data = await request.formData();
      const id = validateString(data.get('id'));
      const lab = validateString(data.get('name'));
      logger.debug('creating lab', { id, lab });

      await insertNewLab(db, id, lab);
      logger.info('lab created', { id, lab });
    });
  },
  async quota({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to update lab quota without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to update lab quota', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const draft = await getActiveDraft(db);
    if (typeof draft !== 'undefined' && draft.currRound !== null && draft.currRound > 0) {
      logger.warn('cannot update lab quota while a draft is ongoing', {
        'draft.round.current': draft.currRound,
      });
      error(403, 'It is unsafe to update the lab quota while a draft is ongoing.');
    }

    return await tracer.asyncSpan('action.quota', async () => {
      const pairs = mapRowTuples(await request.formData());
      await updateLabQuotas(db, pairs);
      logger.info('lab quotas updated');
    });
  },
  async archive({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to archive lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to archive lab', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const draft = await getActiveDraft(db);
    if (typeof draft !== 'undefined') {
      logger.warn('cannot archive lab while draft is active');
      error(403, 'Cannot archive labs while a draft is active.');
    }

    return await tracer.asyncSpan('action.archive', async () => {
      const data = await request.formData();
      const id = validateString(data.get('archive'));
      logger.debug('archiving lab', { id });

      await deleteLab(db, id);
      logger.info('lab archived');
    });
  },
  async restore({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to restore lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to restore lab', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const draft = await getActiveDraft(db);
    if (typeof draft !== 'undefined') {
      logger.warn('cannot restore lab while draft is active');
      error(403, 'Cannot restore labs while a draft is active.');
    }

    return await tracer.asyncSpan('action.restore', async () => {
      const data = await request.formData();
      const id = validateString(data.get('restore'));
      logger.debug('restoring lab', { id });

      await restoreLab(db, id);
      logger.info('lab restored');
    });
  },
};
