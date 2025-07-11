import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.REDIS_HOST !== 'undefined');
  assert(typeof env.REDIS_PORT !== 'undefined');
}

export const BULLMQ_HOST = env.REDIS_HOST;
export const BULLMQ_PORT = Number.parseInt(env.REDIS_PORT, 10);
