import { error, redirect } from '@sveltejs/kit';
import { validateString } from '$lib/forms';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
    error(403);

  return { user: session.user, senders: await db.getCandidateSenders() };
}

export const actions = {
  async demote({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
      error(403);

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    if (await db.deleteDesignatedSender(userId)) return;
    error(404, 'Designated sender does not exist.');
  },
  async promote({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
      error(403);

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));

    await db.begin(async db => {
      const upsertDesignatedSender = await db.upsertDesignatedSender(userId);
      db.logger.info({ upsertDesignatedSender });
      // TODO: Reinstate notifications channel.
      // await db.notifyDraftChannel();
      // await db.notifyUserChannel();
    });
  },
  async remove({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null)
      error(403);

    const data = await request.formData();
    const userId = validateString(data.get('user-id'));
    if (await db.deleteCandidateSender(userId)) return;
    error(404, 'Sender email does not exist.');
  },
};
