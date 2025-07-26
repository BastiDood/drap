import { redirect } from '@sveltejs/kit';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access drafts page without session');
    redirect(307, '/oauth/login/');
  }

  const { draft } = await parent();
  if (typeof draft === 'undefined') {
    db.logger.warn('no active draft found');
    return { notifications: [] };
  }

  const notificationRecords = await db.getNotificationsByDraftId(draft.id);
  return { notificationRecords };
}
