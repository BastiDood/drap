import type { BulkJobOptions } from 'bullmq';

import { bulkInsertNotifications, db } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import type { Notification } from '$lib/server/models/notification';
import { Tracer } from '$lib/server/telemetry/tracer';

import { getQueue } from './redis';

const SERVICE_NAME = 'queue.notification.dispatcher';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

const NotificationDispatcher = {
  async bulkDispatchNotification(...notifications: Notification[]) {
    return await tracer.asyncSpan('bulk-dispatch-notification', async span => {
      span.setAttribute('queue.notification.count', notifications.length);
      const requests = await bulkInsertNotifications(db, ...notifications);
      const requestIds = requests.map(({ id }) => id);
      logger.info('notification requests received', {
        'queue.notification.request_ids': requestIds,
      });

      const jobs = await getQueue().addBulk(
        requestIds.map(jobId => ({
          name: 'notification',
          data: null,
          opts: {
            jobId,
            removeOnComplete: true,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 3000,
            },
          } satisfies BulkJobOptions,
        })),
      );

      logger.info('new jobs created', { 'queue.job.count': jobs.length });
      return jobs;
    });
  },
};

export const dispatch = NotificationDispatcher;
