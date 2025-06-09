import assert from 'node:assert/strict';

import { env } from '$env/dynamic/private';

assert(typeof env.POSTGRES_URL !== 'undefined');
export const URL = env.POSTGRES_URL;
