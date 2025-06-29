import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.GOOGLE_OAUTH_CLIENT_ID !== 'undefined');
  assert(typeof env.GOOGLE_OAUTH_CLIENT_SECRET !== 'undefined');
  assert(typeof env.GOOGLE_OAUTH_REDIRECT_URI !== 'undefined');
}

export const OAUTH_CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
export const OAUTH_CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
export const OAUTH_REDIRECT_URI = env.GOOGLE_OAUTH_REDIRECT_URI;
