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
import { connection } from '$lib/server/queue';

export const QUEUE_NAME = 'NOTIFICATION_QUEUE';

export class NotificationDispatcher implements Loggable {
  #db: Database;
  #logger: Logger;
  #queue: Queue<null>;
  #events: QueueEvents;

  constructor(logger: Logger, db: Database) {
    this.#logger = logger;
    this.#db = db;
    this.#queue = new Queue(QUEUE_NAME, { connection });
    this.#events = new QueueEvents(QUEUE_NAME, { connection });
    this.#events.on('completed', ({ jobId }) => this.#logger.info({ jobId }, 'job completed'));
    this.#events.on('failed', ({ jobId }) => this.#logger.error({ jobId }, 'job failed'));
  }

  @timed async bulkDispatchNotification(...notifications: Notification[]) {
    const requests = await this.#db.bulkInsertNotifications(...notifications);
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
    return { target: 'Draft', draftId: Number(draftId), round: draftRound } satisfies BaseDraftNotification;
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
