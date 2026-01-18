import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.INNGEST_EVENT_KEY !== 'undefined');
}

export const EVENT_KEY = env.INNGEST_EVENT_KEY;
