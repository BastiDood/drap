import { Queue, QueueEvents, Worker } from 'bullmq';
import { Redis } from 'ioredis';

import * as APP from '$lib/server/env';
import * as REDIS from '$lib/server/env/redis';
import { building } from '$app/environment';
import { initializeProcessor } from '$lib/server/email';
import { logger } from '$lib/server/logger';

// Queue should lazily connect to Redis.
const QUEUE_NAME = 'notifications';

/** Internal {@linkcode Queue} meant for lazy initialization. */
// eslint-disable-next-line @typescript-eslint/init-declarations
let queue: Queue<null> | undefined;

/**
 * Lazy singleton initialization to prevent connection attempts during the build step.
 * @see https://github.com/taskforcesh/bullmq/issues/281
 */
export function getQueue() {
  queue ??= new Queue<null>(QUEUE_NAME, { connection: { lazyConnect: true, url: REDIS.URL } });
  return queue;
}

if (building) {
  // No Redis connections are needed during the build step.
} else {
  const connection = new Redis(REDIS.URL, {
    // We *must* lazily connect so that Redis does not try to connect during builds.
    lazyConnect: true,
    // BullMQ wants to retry indefinitely, so it requires this to be set to `null`.
    maxRetriesPerRequest: null,
  });

  // Monitoring for job completion events
  const events = new QueueEvents(QUEUE_NAME, { connection });
  events.on('completed', ({ jobId }) => logger.info({ jobId }, 'job completed'));
  events.on('failed', ({ jobId }) => logger.error({ jobId }, 'job failed'));

  // NOTE: This will only register if this module is imported (even transitively).
  const child = logger.child({ notifications: 'worker' });
  const worker = new Worker(QUEUE_NAME, initializeProcessor(child), {
    concurrency: APP.JOB_CONCURRENCY,
    connection,
  });
  child.info({ workerId: worker.id }, 'worker initialized');
}
