import { error, redirect } from '@sveltejs/kit';

import {
  db,
  deleteCandidateSender,
  deleteDesignatedSender,
  getCandidateSenders,
  upsertDesignatedSender,
} from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.email';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access email page without session');
    redirect(307, '/oauth/login/');
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    logger.error('insufficient permissions to access email page', void 0, {
      'auth.user.is_admin': session.user.isAdmin,
      'auth.user.google_id': session.user.googleUserId,
      'user.lab_id': session.user.labId,
    });
    error(403);
  }

  const senders = await getCandidateSenders(db);
  logger.info('candidate senders fetched', { 'email.sender.count': senders.length });

  return { user: session.user, senders };
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
        'auth.user.is_admin': session.user.isAdmin,
        'auth.user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    logger.info('demoting sender', { 'email.sender.user_id': userId });

    if (await deleteDesignatedSender(db, userId)) {
      logger.info('sender demoted');
      return;
    }

    logger.error('sender does not exist');
    error(404, 'Designated sender does not exist.');
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
        'auth.user.is_admin': session.user.isAdmin,
        'auth.user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    logger.info('promoting sender', { 'email.sender.user_id': userId });

    if (await upsertDesignatedSender(db, userId)) {
      logger.info('sender promoted as designated sender');
    } else {
      logger.error('sender does not exist', void 0, { 'email.sender.user_id': userId });
      error(404);
    }
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
        'auth.user.is_admin': session.user.isAdmin,
        'auth.user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    logger.info('removing sender', { 'email.sender.user_id': userId });

    if (await deleteCandidateSender(db, userId)) {
      logger.info('sender removed');
    } else {
      logger.error('sender does not exist');
      error(404, 'Sender email does not exist.');
    }
  },
};
