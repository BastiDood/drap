import { getQueue } from '$lib/server/queue/redis.js';
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
    notifications.map(async notification => {
      const { id, data, deliveredAt } = notification;
      
      // check the job's status
      let isFailed = false;
      if (deliveredAt === null) {
        const job = await getQueue().getJob(id);
        // assume that any job in the db but without queue records has failed
        isFailed = (typeof job === 'undefined' || await job.isFailed())
      }

      // retrieve the user data for notifications that involve it
      if ('userId' in data && typeof data.userId !== 'undefined')
        return { ...notification, user: await db.getUserById(data.userId), isFailed };
      return { ...notification, user: null, isFailed };
    }),
  );

  return { notificationRecords };
}
