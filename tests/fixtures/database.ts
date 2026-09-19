import assert from 'node:assert/strict';
import { env } from 'node:process';

import { type DrizzleDatabase, init } from '$lib/server/database/drizzle';
import { draft, lab } from '$lib/server/database/schema';
import { test } from '@playwright/test';
import { sql } from 'drizzle-orm';

assert(env.POSTGRES_URL, 'POSTGRES_URL must be set');
const { POSTGRES_URL } = env;

export const testDatabase = test.extend<object, { database: DrizzleDatabase }>({
  database: [
    // eslint-disable-next-line no-empty-pattern -- required by Playwright to be destructured
    async ({}, use) => {
      const db = init(POSTGRES_URL);
      await db.execute(sql`TRUNCATE ${draft}, ${lab} RESTART IDENTITY CASCADE`);
      await use(db);
      await db.$client.end();
    },
    { scope: 'worker' },
  ],
});
