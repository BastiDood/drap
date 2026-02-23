import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { deleteLab, getLabRegistry, insertNewLab, restoreLab } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const LabFormData = v.object({
  labId: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
});

const ArchiveFormData = v.object({
  archive: v.pipe(v.string(), v.minLength(1)),
});

const RestoreFormData = v.object({
  restore: v.pipe(v.string(), v.minLength(1)),
});

const SERVICE_NAME = 'routes.dashboard.admin.labs';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access labs page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.error('insufficient permissions to access labs page', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('load-labs-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });

    const labs = await getLabRegistry(db, false);
    logger.debug('labs page loaded', { 'lab.count': labs.length });
    return { labs };
  });
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
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.lab', async () => {
      const data = await request.formData();
      const { labId, name } = v.parse(LabFormData, decode(data));
      logger.debug('creating lab', { labId, name });

      await insertNewLab(db, labId, name);
      logger.info('lab created', { labId, name });
    });
  },
  async archive({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to archive lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to archive lab', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.archive', async () => {
      const data = await request.formData();
      const { archive: labId } = v.parse(ArchiveFormData, decode(data));
      logger.debug('archiving lab', { labId });

      await deleteLab(db, labId);
      logger.info('lab archived');
    });
  },
  async restore({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to restore lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.error('insufficient permissions to restore lab', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.restore', async () => {
      const data = await request.formData();
      const { restore: labId } = v.parse(RestoreFormData, decode(data));
      logger.debug('restoring lab', { labId });

      await restoreLab(db, labId);
      logger.info('lab restored');
    });
  },
};
