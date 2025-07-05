import { BULLMQ_HOST, BULLMQ_PORT } from '$lib/server/env/bullmq';
import { type Loggable, timed } from '$lib/server/database/decorators';
import { Queue, QueueEvents } from 'bullmq';
import type { Database } from '$lib/server/database';
import { EmailSendRequest } from '$lib/server/models/email';
import type { Logger } from 'pino';
import type { Notification } from '$lib/server/models/notification';

export const queueName = 'notifqueue';

export class NotificationDispatcher implements Loggable {
  #queue: Queue;
  #queueEvents: QueueEvents;
  #logger: Logger;
  #db: Database

  constructor(logger: Logger, db: Database) {
    this.#queue = new Queue<EmailSendRequest>(queueName, {
      connection: {
        host: BULLMQ_HOST,
        port: parseInt(BULLMQ_PORT ?? '', 10),
      },
    });

    this.#logger = logger;
    this.#queueEvents = new QueueEvents(queueName);
    this.#db = db;

    this.#queueEvents.on('completed', this.#onCompleted);
    this.#queueEvents.on('failed', this.#onFailed);

    this.#logger.info('email queue setup complete');
  }

  #onCompleted(args: { jobId: string }) {
    this.#logger.info('email job completed', args);
  }

  #onFailed(args: { jobId: string }) {
    this.#logger.error('email job failed', args);
  }

  get logger() {
    return this.#logger;
  }

  @timed async sendNotificationRequest(notifRequest: Notification) {
    const requestId = await this.#db.insertNotification(notifRequest);

    const job = await this.#queue.add(requestId, notifRequest);

    this.#logger.info({ job });

    return job;
  }
}
