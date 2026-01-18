import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.INNGEST_SIGNING_KEY !== 'undefined');
}

export const SIGNING_KEY = env.INNGEST_SIGNING_KEY;
