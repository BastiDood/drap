import assert from 'node:assert/strict';
import { env } from '$env/dynamic/private';

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = env;
assert(typeof GOOGLE_OAUTH_CLIENT_ID !== 'undefined');
assert(typeof GOOGLE_OAUTH_CLIENT_SECRET !== 'undefined');
assert(typeof GOOGLE_OAUTH_REDIRECT_URI !== 'undefined');

export default {
    OAUTH_CLIENT_ID: GOOGLE_OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: GOOGLE_OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI: GOOGLE_OAUTH_REDIRECT_URI,
};
