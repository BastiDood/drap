import { BULLMQ_HOST, BULLMQ_PORT } from '$lib/server/env/bullmq';
import { type Loggable, timed } from '$lib/server/database/decorators';
import { Queue, QueueEvents } from 'bullmq';
import { EmailSendRequest } from '$lib/server/models/email';
import type { Logger } from 'pino';
import { ulid } from 'ulid';

export class EmailQueue implements Loggable {
    #queue: Queue;
    #queueEvents: QueueEvents;
    #logger: Logger;
    
    constructor(logger: Logger) {
        this.#queue = new Queue<EmailSendRequest>('emailqueue', {
            connection: {
                host: BULLMQ_HOST,
                port: parseInt(BULLMQ_PORT ?? "", 10)
            }
        })

        this.#logger = logger;
        this.#queueEvents = new QueueEvents('emailqueue');
        
        this.#queueEvents.on('completed', this.#onCompleted);
        this.#queueEvents.on('failed', this.#onFailed);

        this.#logger.info('email queue setup complete');
    }

    #onCompleted(args: { jobId: string }) {
        this.#logger.info('email job completed', args);
    }

    #onFailed(args: { jobId: string }) {
        this.#logger.error('email job failed', args)
    }

    get logger() {
        return this.#logger;
    }
    
    @timed async sendEmailRequest(emailRequest: EmailSendRequest) {
        const requestId = ulid();
        
        const job = await this.#queue.add(requestId, emailRequest);

        this.#logger.info({ job })

        return job;
    }
}