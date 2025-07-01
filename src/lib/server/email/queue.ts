import { BULLMQ_HOST, BULLMQ_PORT } from '$lib/server/env/bullmq';
import { Queue } from 'bullmq';

export class EmailQueue {
    #queue: Queue;
    
    constructor() {
        this.#queue = new Queue('emailqueue', {
            connection: {
                host: BULLMQ_HOST,
                port: parseInt(BULLMQ_PORT ?? "", 10)
            }
        })
    }   
}