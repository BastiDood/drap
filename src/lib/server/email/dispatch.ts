import {
  type BaseDraftNotif,
  DraftNotification,
  Notification,
  QueuedNotification,
  UserNotification,
} from '$lib/server/models/notification';
import { type BulkJobOptions, Queue, QueueEvents } from 'bullmq';
import { HOST, PORT } from '$lib/server/env/redis';
import { type Loggable, timed } from '$lib/server/database/decorators';
import type { Database } from '$lib/server/database';
import type { Logger } from 'pino';
import type { User } from '$lib/server/database/schema';
import { parse } from 'valibot';

export const queueName = 'notifqueue';

export class NotificationDispatcher implements Loggable {
  #queue: Queue;
  #queueEvents: QueueEvents;
  #logger: Logger;
  #db: Database;

  constructor(logger: Logger, db: Database) {
    this.#queue = new Queue<QueuedNotification>(queueName, {
      connection: {
        host: HOST,
        port: PORT,
      },
    });

    this.#queueEvents = new QueueEvents(queueName);
    this.#db = db;
    this.#logger = logger;

    this.#queueEvents.on('completed', ({ jobId }) => {
      this.#logger.info('email job completed', jobId);
    });
    this.#queueEvents.on('failed', ({ jobId }) => {
      this.#logger.error('email job failed', jobId);
    });

    this.#logger.info('email queue setup complete');
  }

  async #sendNotificationRequest(notifRequest: Notification) {
    // one last sanity check to gatekeep the queue
    const parsedNotifRequest = parse(Notification, notifRequest);

    const request = await this.#db.insertNotification(parsedNotifRequest);

    if (typeof request === 'undefined') return;
    const { id: requestId } = request;

    this.#logger.info('new notification request received', { parsedNotifRequest });

    const job = await this.#queue.add(
      requestId,
      { requestId },
      {
        jobId: requestId,
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 3000,
        },
      },
    );

    this.#logger.info({ job }, 'new job created');

    return job;
  }

  async #sendBulkNotificationRequest(notifRequests: Notification[]) {
    const requests = await this.#db.insertNotificationsBulk(notifRequests);
    this.#logger.info('new notification requests bulk received', { requests });

    const jobs = requests.map(({ id }) => {
      return {
        name: id,
        data: { requestsId: id },
        opts: {
          jobId: id,
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 3000,
          },
        } satisfies BulkJobOptions,
      };
    });

    const insertedJobs = await this.#queue.addBulk(jobs);
    this.#logger.info({ insertedJobs: insertedJobs.length }, 'new jobs created');
    return insertedJobs;
  }

  #constructDraftNotification(draftId: bigint, draftRound: number | null): BaseDraftNotif {
    this.#logger.info('new draft notification constructed');

    const currentRound = draftRound;

    return { target: 'Draft', draftId, round: currentRound };
  }

  @timed async dispatchDraftRoundStartNotification(draftId: bigint, draftRound: number | null) {
    const baseNotif = this.#constructDraftNotification(draftId, draftRound);
    return await this.#sendNotificationRequest({
      ...baseNotif,
      type: 'RoundStart',
    } satisfies DraftNotification);
  }

  @timed async bulkDispatchDraftRoundStartNotification(
    args: { draftId: bigint; draftRound: number | null }[],
  ) {
    return await this.#sendBulkNotificationRequest(
      args.map(({ draftId, draftRound }) => {
        const baseNotif = this.#constructDraftNotification(draftId, draftRound);
        return { ...baseNotif, type: 'RoundStart' } satisfies DraftNotification;
      }),
    );
  }

  @timed async dispatchRoundSubmittedNotification(
    labId: string,
    labName: string,
    draftId: bigint,
    draftRound: number | null,
  ) {
    const baseNotif = this.#constructDraftNotification(draftId, draftRound);
    return await this.#sendNotificationRequest({
      ...baseNotif,
      type: 'RoundSubmit',
      labName,
      labId,
    } satisfies DraftNotification);
  }

  @timed async bulkDispatchRoundSubmittedNotification(
    args: {
      labId: string;
      labName: string;
      draftId: bigint;
      draftRound: number | null;
    }[],
  ) {
    return await this.#sendBulkNotificationRequest(
      args.map(({ labId, labName, draftId, draftRound }) => {
        const baseNotif = this.#constructDraftNotification(draftId, draftRound);
        return {
          ...baseNotif,
          type: 'RoundSubmit',
          labName,
          labId,
        } satisfies DraftNotification;
      }),
    );
  }

  @timed async dispatchLotteryInterventionNotification(
    labId: string,
    labName: string,
    givenName: string,
    familyName: string,
    email: string,
    draftId: bigint,
  ) {
    const baseNotif = this.#constructDraftNotification(draftId, null);
    return await this.#sendNotificationRequest({
      ...baseNotif,
      type: 'LotteryIntervention',
      labId,
      labName,
      givenName,
      familyName,
      email,
    } satisfies DraftNotification);
  }

  @timed async bulkDispatchLotteryInterventionNotification(
    args: {
      labId: string;
      labName: string;
      givenName: string;
      familyName: string;
      email: string;
      draftId: bigint;
    }[],
  ) {
    return await this.#sendBulkNotificationRequest(
      args.map(({ labId, labName, givenName, familyName, email, draftId }) => {
        const baseNotif = this.#constructDraftNotification(draftId, null);
        return {
          ...baseNotif,
          type: 'LotteryIntervention',
          labId,
          labName,
          givenName,
          familyName,
          email,
        } satisfies DraftNotification;
      }),
    );
  }

  @timed async dispatchDraftConcludedNotification(draftId: bigint) {
    const baseNotif = await this.#constructDraftNotification(draftId, null);
    return await this.#sendNotificationRequest({ ...baseNotif, type: 'Concluded' });
  }

  @timed async dispatchUserNotification(user: User, labName: string, labId: string) {
    return await this.#sendNotificationRequest({
      target: 'User',
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      labName,
      labId,
    } satisfies UserNotification);
  }

  @timed async bulkDispatchUserNotification(
    args: { user: User; labName: string; labId: string }[],
  ) {
    return await this.#sendBulkNotificationRequest(
      args.map(({ user, labName, labId }) => {
        return {
          target: 'User',
          email: user.email,
          givenName: user.givenName,
          familyName: user.familyName,
          labName,
          labId,
        } satisfies UserNotification;
      }),
    );
  }

  get logger() {
    return this.#logger;
  }
}

export interface DispatchRoundStartArgs {
  draftId: bigint;
  draftRound: number | null;
}

export interface DispatchRoundSubmittedArgs {
  labId: string;
  labName: string;
  draftId: bigint;
  draftRound: number | null;
}

export interface DispatchLotteryInterventionArgs {
  labId: string;
  labName: string;
  givenName: string;
  familyName: string;
  email: string;
  draftId: bigint;
}

export interface DispatchDraftConcludedArgs {
  draftId: string;
}

export interface DispatchUserNotificationArgs {
  user: User;
  labName: string;
  labId: string;
}
