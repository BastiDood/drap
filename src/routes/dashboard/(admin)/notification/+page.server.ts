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

  const notifications = await db.getNotificationsByDraftId(draft.id);
  const notificationRecords = await Promise.all(
    notifications.map(async (notification) => {
      const { data } = notification;
      // retrieve the user data for notifications that involve it
      if ('userId' in data && typeof data.userId !== 'undefined')
        return { ...notification, user: await db.getUserById(data.userId) };
      return { ...notification, user: null };
    })
  );

  return { notificationRecords };
}
