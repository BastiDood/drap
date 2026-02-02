import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import {
  deleteCandidateSender,
  deleteDesignatedSender,
  getCandidateSenders,
  upsertDesignatedSender,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SenderFormData = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
});

const SERVICE_NAME = 'routes.dashboard.email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access email page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    logger.error('insufficient permissions to access email page', void 0, {
      'user.is_admin': session.user.isAdmin,
      'user.google_id': session.user.googleUserId,
      'user.lab_id': session.user.labId,
    });
    error(403);
  }

  const { id: sessionId, user } = session;
  const { id: userId } = user;

  return await tracer.asyncSpan('load-email-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });

    const senders = await getCandidateSenders(db);
    logger.debug('candidate senders fetched', { 'email.sender.count': senders.length });

    return { user, senders };
  });
}

export const actions = {
  async demote({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to demote sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.error('insufficient permissions to demote sender', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.demote', async () => {
      const data = await request.formData();
      const { userId } = v.parse(SenderFormData, decode(data));
      logger.debug('demoting sender', { 'email.sender.user_id': userId });

      if (await deleteDesignatedSender(db, userId)) {
        logger.info('sender demoted');
        return;
      }

      logger.warn('sender does not exist');
      error(404, 'Designated sender does not exist.');
    });
  },
  async promote({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to promote sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.error('insufficient permissions to promote sender', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.promote', async () => {
      const data = await request.formData();
      const { userId } = v.parse(SenderFormData, decode(data));
      logger.debug('promoting sender', { 'email.sender.user_id': userId });

      if (await upsertDesignatedSender(db, userId)) {
        logger.info('sender promoted as designated sender');
      } else {
        logger.warn('sender does not exist', { 'email.sender.user_id': userId });
        error(404);
      }
    });
  },
  async remove({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to remove sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.error('insufficient permissions to remove sender', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.remove', async () => {
      const data = await request.formData();
      const { userId } = v.parse(SenderFormData, decode(data));
      logger.debug('removing sender', { 'email.sender.user_id': userId });

      if (await deleteCandidateSender(db, userId)) {
        logger.info('sender removed');
      } else {
        logger.warn('sender does not exist');
        error(404, 'Sender email does not exist.');
      }
    });
  },
};
