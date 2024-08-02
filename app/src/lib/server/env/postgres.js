import assert from 'node:assert/strict';
import { env } from '$env/dynamic/private';

const { POSTGRES_URL } = env;
assert(typeof POSTGRES_URL !== 'undefined');

export default { URL: POSTGRES_URL };
