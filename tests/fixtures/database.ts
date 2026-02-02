import assert from 'node:assert/strict';
import { env } from 'node:process';

import { reset } from 'drizzle-seed';
import { test } from '@playwright/test';

import * as schema from '$lib/server/database/schema';
import { type DrizzleDatabase, init } from '$lib/server/database/drizzle';

assert(env.POSTGRES_URL, 'POSTGRES_URL must be set');
const { POSTGRES_URL } = env;

export const testDatabase = test.extend<object, { database: DrizzleDatabase }>({
  database: [
    // eslint-disable-next-line no-empty-pattern -- required by Playwright to be destructured
    async ({}, use) => {
      const db = init(POSTGRES_URL);
      await use(db);
      await reset(db, schema);
      await db.$client.end();
    },
    { scope: 'worker' },
  ],
});
