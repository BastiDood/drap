import assert from 'node:assert/strict';
import { env } from '$env/dynamic/private';

const { DATABASE_URL } = env;
assert(typeof DATABASE_URL !== 'undefined');

export default { URL: DATABASE_URL };
