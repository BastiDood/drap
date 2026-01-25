import { env } from '$env/dynamic/private';

export const ENABLE_EMAILS = typeof env.DRAP_ENABLE_EMAILS !== 'undefined';
if (ENABLE_EMAILS) console.log('Emails are enabled.');
else console.warn('Dry run mode activated. Emails are disabled.');
