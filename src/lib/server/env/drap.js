import { env } from '$env/dynamic/private';

/** Disabled by default as a development precaution. Must be turned on in production. */
export const ENABLE_EMAILS = typeof env.DRAP_ENABLE_EMAILS !== 'undefined';

/* eslint-disable no-console */

if (ENABLE_EMAILS) console.log('Emails are enabled.');
else console.warn('Dry run mode activated. Emails are disabled.');

/* eslint-enable no-console */
