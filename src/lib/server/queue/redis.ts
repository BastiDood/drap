import { Queue, QueueEvents, RedisConnection, Worker } from 'bullmq';

import * as APP from '$lib/server/env';
import * as REDIS from '$lib/server/env/redis';
import { building } from '$app/environment';
import { initializeProcessor } from '$lib/server/email';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'queue.redis';
const logger = Logger.byName(SERVICE_NAME);

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
  const connection = new RedisConnection({
    url: REDIS.URL,
    // We *must* lazily connect so that Redis does not try to connect during builds.
    lazyConnect: true,
    // BullMQ wants to retry indefinitely, so it requires this to be set to `null`.
    maxRetriesPerRequest: null,
  });

  // Monitoring for job completion events
  // @ts-expect-error - Version mismatch for some reason?
  const events = new QueueEvents(QUEUE_NAME, { connection });
  events.on('completed', ({ jobId }) => logger.info('job completed', { 'queue.job.id': jobId }));
  events.on('failed', ({ jobId }) => logger.error('job failed', void 0, { 'queue.job.id': jobId }));

  // NOTE: This will only register if this module is imported (even transitively).
  const worker = new Worker(QUEUE_NAME, initializeProcessor(), {
    // @ts-expect-error - Version mismatch for some reason?
    connection,
    concurrency: APP.JOB_CONCURRENCY,
  });
  logger.info('worker initialized', { 'queue.worker.id': worker.id });
}
