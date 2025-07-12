import { env } from '$env/dynamic/private';

// eslint-disable-next-line @typescript-eslint/init-declarations
let jobConcurrency: number | undefined;
if (typeof env.JOB_CONCURRENCY !== 'undefined')
  jobConcurrency = Number.parseInt(env.JOB_CONCURRENCY, 10);

/** Maximum number of email worker jobs to run concurrently. */
export const JOB_CONCURRENCY = jobConcurrency;
