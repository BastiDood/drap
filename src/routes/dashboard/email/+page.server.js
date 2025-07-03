import { error, redirect } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access email page without session');
    redirect(307, '/oauth/login/');
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    db.logger.error(
      {
        isAdmin: session.user.isAdmin,
        googleUserId: session.user.googleUserId,
        labId: session.user.labId,
      },
      'insufficient permissions to access email page',
    );
    error(403);
  }

  const senders = await db.getCandidateSenders();
  db.logger.info({ senderCount: senders.length }, 'candidate senders fetched');

  return { user: session.user, senders };
}

export const actions = {
  async demote({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to demote sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      db.logger.error(
        {
          isAdmin: session.user.isAdmin,
          googleUserId: session.user.googleUserId,
          labId: session.user.labId,
        },
        'insufficient permissions to demote sender',
      );
      error(403);
    }

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    db.logger.info({ senderUserId: userId }, 'demoting sender');

    if (await db.deleteDesignatedSender(userId)) {
      db.logger.info('sender demoted');
      return;
    }

    db.logger.error('sender does not exist');
    error(404, 'Designated sender does not exist.');
  },
  async promote({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to promote sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      db.logger.error(
        {
          isAdmin: session.user.isAdmin,
          googleUserId: session.user.googleUserId,
          labId: session.user.labId,
        },
        'insufficient permissions to promote sender',
      );
      error(403);
    }

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    db.logger.info({ senderUserId: userId }, 'promoting sender');

    await db.begin(async db => {
      const upsertDesignatedSender = await db.upsertDesignatedSender(userId);
      db.logger.info({ upsertDesignatedSender }, 'sender promoted as designated sender');
      // TODO: Reinstate notifications channel.
      // await db.notifyDraftChannel();
      // await db.notifyUserChannel();
    });
  },
  async remove({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to remove sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      db.logger.error(
        {
          isAdmin: session.user.isAdmin,
          googleUserId: session.user.googleUserId,
          labId: session.user.labId,
        },
        'insufficient permissions to remove sender',
      );
      error(403);
    }

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    db.logger.info({ senderUserId: userId }, 'removing sender');

    if (await db.deleteCandidateSender(userId)) {
      db.logger.info('sender removed');
      return;
    }

    db.logger.error('sender does not exist');
    error(404, 'Sender email does not exist.');
  },
};
