import { env } from '$env/dynamic/private';

export const DEBUG = typeof env.DRIZZLE_DEBUG !== 'undefined';
