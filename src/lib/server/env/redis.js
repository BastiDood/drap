import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.REDIS_URL !== 'undefined');
}

export const URL = env.REDIS_URL ?? '';
