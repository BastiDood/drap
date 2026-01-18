import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.ORIGIN !== 'undefined');
  assert(typeof env.GOOGLE_OAUTH_CLIENT_ID !== 'undefined');
  assert(typeof env.GOOGLE_OAUTH_CLIENT_SECRET !== 'undefined');
}

export const OAUTH_CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID ?? '';
export const OAUTH_CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';

const redirectUrl = new URL(env.ORIGIN ?? '');
redirectUrl.pathname = '/dashboard/oauth/callback';
export const OAUTH_REDIRECT_URI = redirectUrl.href;
