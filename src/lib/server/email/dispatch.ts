import { type BulkJobOptions, Queue, QueueEvents } from 'bullmq';
import type { Logger } from 'pino';

import { building } from '$app/environment';

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
import { type Loggable, timed } from '$lib/server/database/decorators';
import type { Database } from '$lib/server/database';
import { logger } from '$lib/server/logger';

export const QUEUE_NAME = 'notifications';

if (building) {
  // Prevent listening to events during the build step to avoid connecting to Redis.
} else {
  const EVENTS = new QueueEvents(QUEUE_NAME, { connection: { url: REDIS.URL } });
  EVENTS.on('completed', ({ jobId }) => logger.info({ jobId }, 'job completed'));
  EVENTS.on('failed', ({ jobId }) => logger.error({ jobId }, 'job failed'));
}

export class NotificationDispatcher implements Loggable {
  #db: Database;
  #logger: Logger;

  /** Lazy singleton initialization to prevent connection attempts during the build step. */
  static #queue: Queue<null> | undefined;

  constructor(logger: Logger, db: Database) {
    this.#logger = logger;
    this.#db = db;
  }

  static #getOrInitQueue() {
    NotificationDispatcher.#queue ??= new Queue(QUEUE_NAME, { connection: { url: REDIS.URL } });
    return NotificationDispatcher.#queue;
  }

  @timed async bulkDispatchNotification(...notifications: Notification[]) {
    const requests = await this.#db.bulkInsertNotifications(...notifications);
    const requestIds = requests.map(({ id }) => id);
    this.#logger.info('new notification requests bulk received', { requestIds });

    const jobs = await NotificationDispatcher.#getOrInitQueue().addBulk(
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
    return {
      target: 'Draft',
      draftId: Number(draftId),
      round: draftRound,
    } satisfies BaseDraftNotification;
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
