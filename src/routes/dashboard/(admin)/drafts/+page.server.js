import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import { db, getDrafts, getLabRegistry, hasActiveDraft, initDraft } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access drafts page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.warn('insufficient permissions to access drafts page', {
      'auth.user.is_admin': user.isAdmin,
      'auth.user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const [drafts, labs] = await Promise.all([getDrafts(db), getLabRegistry(db)]);

  logger.debug('drafts page loaded', {
    'draft.count': drafts.length,
    'lab.count': labs.length,
  });

  return { drafts, labs };
}

const InitFormData = v.object({
  rounds: v.number(),
  closesAt: v.date(),
});

export const actions = {
  async init({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to init draft without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.warn('insufficient permissions to init draft', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.init', async () => {
      if (await hasActiveDraft(db)) {
        logger.warn('attempt to init draft while active draft exists');
        error(409, 'An active draft already exists');
      }

      const data = await request.formData();
      const { rounds, closesAt } = v.parse(
        InitFormData,
        decode(data, { numbers: ['rounds'], dates: ['closesAt'] }),
      );
      logger.debug('initializing draft', {
        'draft.round.max': rounds,
        'draft.registration.closes_at': closesAt.toISOString(),
      });

      const draft = await initDraft(db, rounds, closesAt);
      logger.info('draft initialized', {
        'draft.id': draft.id.toString(),
        'draft.active_period_start': draft.activePeriodStart.toISOString(),
      });
    });
  },
};
