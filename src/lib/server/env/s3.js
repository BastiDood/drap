import assert from 'node:assert/strict';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

if (building) {
  // It doesn't make sense to assert environment variables at build-time.
} else {
  assert(typeof env.S3_REGION !== 'undefined');
  assert(typeof env.S3_ACCESS_KEY !== 'undefined');
  assert(typeof env.S3_SECRET_KEY !== 'undefined');
}

export const { S3_ENDPOINT, S3_REGION = '', S3_ACCESS_KEY = '', S3_SECRET_KEY = '' } = env;
