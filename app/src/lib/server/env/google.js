import assert from 'node:assert/strict';

import { env } from '$env/dynamic/private';

assert(typeof env.GOOGLE_OAUTH_CLIENT_ID !== 'undefined');
export const OAUTH_CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;

assert(typeof env.GOOGLE_OAUTH_CLIENT_SECRET !== 'undefined');
export const OAUTH_CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;

assert(typeof env.GOOGLE_OAUTH_REDIRECT_URI !== 'undefined');
export const OAUTH_REDIRECT_URI = env.GOOGLE_OAUTH_REDIRECT_URI;
