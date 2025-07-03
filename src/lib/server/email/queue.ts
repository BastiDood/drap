import { BULLMQ_HOST, BULLMQ_PORT } from '$lib/server/env/bullmq';
import { type Loggable, timed } from '$lib/server/database/decorators';
import { EmailSendRequest } from '$lib/server/models/email';
import type { Logger } from 'pino';
import { Queue } from 'bullmq';
import { ulid } from 'ulid';

export class EmailQueue implements Loggable {
    #queue: Queue;
    #logger: Logger;
    
    constructor(logger: Logger) {
        this.#queue = new Queue<EmailSendRequest>('emailqueue', {
            connection: {
                host: BULLMQ_HOST,
                port: parseInt(BULLMQ_PORT ?? "", 10)
            }
        })

        this.#logger = logger;
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