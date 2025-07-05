import { BULLMQ_HOST, BULLMQ_PORT } from '$lib/server/env/bullmq';
import type { BaseDraftNotif, Notification } from '$lib/server/models/notification';
import { type Loggable, timed } from '$lib/server/database/decorators';
import { Queue, QueueEvents } from 'bullmq';
import type { Database } from '$lib/server/database';
import type { Logger } from 'pino';
import type { User } from '$lib/server/database/schema';
import { error } from '@sveltejs/kit';

export const queueName = 'notifqueue';

export class NotificationDispatcher implements Loggable {
  #queue: Queue;
  #queueEvents: QueueEvents;
  #logger: Logger;
  #db: Database

  constructor(logger: Logger, db: Database) {
    this.#queue = new Queue<string>(queueName, {
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

  async #sendNotificationRequest(notifRequest: Notification) {
    const requestId = await this.#db.insertNotification(notifRequest);

    this.#logger.info('new notification request received');

    const job = await this.#queue.add(requestId, requestId);

    this.#logger.info({ job }, 'new job created');

    return job;
  }

  async #constructDraftNotification(): Promise<BaseDraftNotif> {
    const currentDraft = await this.#db.getActiveDraft();

    this.#logger.info('new draft notification constructed')

    if (typeof currentDraft === 'undefined') 
      return error(
        500,
        'unexpected draft notif call'
      );
    
    return { target: 'Draft', draftId: Number(currentDraft.id) };
  }

  @timed async dispatchDraftRoundStartNotif() {
    const baseNotif = await this.#constructDraftNotification();
    
    return this.#sendNotificationRequest({ ...baseNotif, type: 'RoundStart' })
  }

  @timed async dispatchRoundSubmittedNotif() {
    const baseNotif = await this.#constructDraftNotification();

    return this.#sendNotificationRequest({ ...baseNotif, type: 'RoundSubmit' });
  }

  @timed async dispatchLotteryInterventionNotif() {
    const baseNotif = await this.#constructDraftNotification();

    return this.#sendNotificationRequest({ ...baseNotif, type: 'LotteryIntervention' });
  }

  @timed async dispatchDraftConcludedNotif() {
    const baseNotif = await this.#constructDraftNotification();

    return this.#sendNotificationRequest({ ...baseNotif, type: 'Concluded' });
  }

  @timed async dispatchUserNotif(user: User, labName: string) {

    return await this.#sendNotificationRequest({
      target: 'User',
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      labName
    })
  }

  get logger() {
    return this.#logger;
  }
}
