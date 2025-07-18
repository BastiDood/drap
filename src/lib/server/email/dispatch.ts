import * as REDIS from '$lib/server/env/redis';
import type {
  BaseDraftNotification,
  DraftConcludedNotification,
  DraftLotteryInterventionNotification,
  DraftRoundStartedNotification,
  DraftRoundSubmittedNotification,
  Notification,
  UserNotification,
} from '$lib/server/models/notification';
import { type BulkJobOptions, Queue, QueueEvents } from 'bullmq';
import { type Loggable, timed } from '$lib/server/database/decorators';
import type { Database } from '$lib/server/database';
import type { Logger } from 'pino';

export const queueName = 'notifqueue';

export class NotificationDispatcher implements Loggable {
  #queue: Queue<null>;
  #queueEvents: QueueEvents;
  #logger: Logger;
  #db: Database;

  constructor(logger: Logger, db: Database) {
    this.#queue = new Queue(queueName, {
      connection: {
        host: REDIS.HOST,
        port: REDIS.PORT,
      },
    });

    this.#queueEvents = new QueueEvents(queueName);
    this.#db = db;
    this.#logger = logger;

    this.#queueEvents.on('completed', ({ jobId }) =>
      this.#logger.info('email job completed', jobId),
    );
    this.#queueEvents.on('failed', ({ jobId }) => this.#logger.error('email job failed', jobId));

    this.#logger.info('email queue setup complete');
  }

  @timed async bulkDispatchNotification(...notifications: Notification[]) {
    const requests = await this.#db.bulkInsertNotifications(notifications);
    const requestIds = requests.map(({ id }) => id);
    this.#logger.info('new notification requests bulk received', { requestIds });

    const jobs = await this.#queue.addBulk(
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

  static #createDraftNotification(draftId: bigint, draftRound: number | null) {
    return { target: 'Draft', draftId, round: draftRound } satisfies BaseDraftNotification;
  }

  static createDraftRoundStartedNotification(draftId: bigint, draftRound: number | null) {
    const base = NotificationDispatcher.#createDraftNotification(draftId, draftRound);
    return { ...base, type: 'RoundStart' } satisfies DraftRoundStartedNotification;
  }

  static createDraftRoundSubmittedNotification(
    draftId: bigint,
    draftRound: number | null,
    labId: string,
  ) {
    const base = NotificationDispatcher.#createDraftNotification(draftId, draftRound);
    return {
      ...base,
      type: 'RoundSubmit',
      labId,
    } satisfies DraftRoundSubmittedNotification;
  }

  static createDraftLotteryInterventionNotification(
    draftId: bigint,
    labId: string,
    userId: string,
  ) {
    const base = NotificationDispatcher.#createDraftNotification(draftId, null);
    return {
      ...base,
      type: 'LotteryIntervention',
      labId,
      userId,
    } satisfies DraftLotteryInterventionNotification;
  }

  static createDraftConcludedNotification(draftId: bigint) {
    const base = NotificationDispatcher.#createDraftNotification(draftId, null);
    return { ...base, type: 'Concluded' } satisfies DraftConcludedNotification;
  }

  static createUserNotification(userId: string, labId: string) {
    return { target: 'User', userId, labId } satisfies UserNotification;
  }

  get logger() {
    return this.#logger;
  }
}
