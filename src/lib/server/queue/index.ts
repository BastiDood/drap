import * as REDIS from '$lib/server/env/redis';
import { Redis } from 'ioredis';

export const connection = new Redis(REDIS.URL, {
  // We *must* lazily connect so that Redis does not try to connect during builds.
  lazyConnect: true,
  // BullMQ wants to retry indefinitely, so it requires this to be set to `null`.
  maxRetriesPerRequest: null,
});
