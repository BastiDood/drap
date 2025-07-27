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
      
      // check the job's status, assume existence of job.failReason implies job.isFailed
      let failReason = null;
      if (deliveredAt === null) {
        const job = await getQueue().getJob(id);
        // assume that any job in the db but without queue records has failed
        failReason = await job?.failedReason ?? "Unknown - job is no longer in queue";
      }

      // retrieve the user data for notifications that involve it
      if ('userId' in data && typeof data.userId !== 'undefined')
        return { ...notification, user: await db.getUserById(data.userId), failReason };
      return { ...notification, user: null, failReason };
    }),
  );

  return { notificationRecords };
}
