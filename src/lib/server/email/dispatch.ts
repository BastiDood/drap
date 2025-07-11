import { BULLMQ_HOST, BULLMQ_PORT } from '$lib/server/env/bullmq';
import {
  type BaseDraftNotif,
  Notification,
  QueuedNotification,
} from '$lib/server/models/notification';
import { type Loggable, timed } from '$lib/server/database/decorators';
import { Queue, QueueEvents } from 'bullmq';
import type { Database } from '$lib/server/database';
import type { Logger } from 'pino';
import type { User } from '$lib/server/database/schema';
import { error } from '@sveltejs/kit';
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
        host: BULLMQ_HOST,
        port: parseInt(BULLMQ_PORT ?? '', 10),
      },
    });

    this.#queueEvents = new QueueEvents(queueName);
    this.#db = db;
    this.#logger = logger;

    this.#queueEvents.on('completed', this.#onCompleted.bind(this));
    this.#queueEvents.on('failed', this.#onFailed.bind(this));

    this.#logger.info('email queue setup complete');
  }

  #onCompleted(args: { jobId: string }) {
    this.#logger.info('email job completed', args);
  }

  #onFailed(args: { jobId: string }) {
    this.#logger.error('email job failed', args);
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

  async #constructDraftNotification(draftRound?: number | null): Promise<BaseDraftNotif> {
    const currentDraft = await this.#db.getActiveDraft();

    this.#logger.info('new draft notification constructed');

    if (typeof currentDraft === 'undefined') return error(500, 'unexpected draft notif call');

    const currentRound = typeof draftRound === 'undefined' ? currentDraft.currRound : draftRound;

    return { target: 'Draft', draftId: Number(currentDraft.id), round: currentRound };
  }

  @timed async dispatchDraftRoundStartNotif(draftRound?: number | null) {
    const baseNotif = await this.#constructDraftNotification(draftRound);

    return this.#sendNotificationRequest({ ...baseNotif, type: 'RoundStart' });
  }

  @timed async dispatchRoundSubmittedNotif(
    labId: string,
    labName: string,
    draftRound?: number | null,
  ) {
    const baseNotif = await this.#constructDraftNotification(draftRound);

    return this.#sendNotificationRequest({ ...baseNotif, type: 'RoundSubmit', labName, labId });
  }

  @timed async dispatchLotteryInterventionNotif(
    labId: string,
    labName: string,
    givenName: string,
    familyName: string,
    email: string,
  ) {
    const baseNotif = await this.#constructDraftNotification();

    return this.#sendNotificationRequest({
      ...baseNotif,
      type: 'LotteryIntervention',
      labId,
      labName,
      givenName,
      familyName,
      email,
    });
  }

  @timed async dispatchDraftConcludedNotif() {
    const baseNotif = await this.#constructDraftNotification();

    return this.#sendNotificationRequest({ ...baseNotif, type: 'Concluded' });
  }

  @timed async dispatchUserNotif(user: User, labName: string, labId: string) {
    return await this.#sendNotificationRequest({
      target: 'User',
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      labName,
      labId,
    });
  }

  get logger() {
    return this.#logger;
  }
}
