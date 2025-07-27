import type { BulkJobOptions } from 'bullmq';
import type { Logger } from 'pino';

import { type Loggable, timed } from '$lib/server/database/decorators';
import type { Database } from '$lib/server/database';
import type { Notification } from '$lib/server/models/notification';

import { getQueue } from './redis';

export class NotificationDispatcher implements Loggable {
  #db: Database;
  #logger: Logger;

  constructor(logger: Logger, db: Database) {
    this.#logger = logger;
    this.#db = db;
  }

  @timed async bulkDispatchNotification(...notifications: Notification[]) {
    const requests = await this.#db.bulkInsertNotifications(...notifications);
    const requestIds = requests.map(({ id }) => id);
    this.#logger.info('new notification requests bulk received', { requestIds });

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

    this.#logger.info({ jobs: jobs.length }, 'new jobs created');
    return jobs;
  }

  get logger() {
    return this.#logger;
  }
}
