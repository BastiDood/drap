import assert from 'node:assert/strict';
import { env } from 'node:process';

import { type DrizzleDatabase, init } from '$lib/server/database/drizzle';
import { draft, lab } from '$lib/server/database/schema';
import { test } from '@playwright/test';
import { sql } from 'drizzle-orm';

assert(env.POSTGRES_URL, 'POSTGRES_URL must be set');
const { POSTGRES_URL } = env;

export function createTestDatabase() {
  return init(POSTGRES_URL);
}

export async function resetTestDatabase(database: DrizzleDatabase) {
  await database.execute(sql`TRUNCATE ${draft}, ${lab} RESTART IDENTITY CASCADE`);
}

export const testDatabase = test.extend<object, { database: DrizzleDatabase }>({
  database: [
    // eslint-disable-next-line no-empty-pattern -- required by Playwright to be destructured
    async ({}, use) => {
      const database = createTestDatabase();
      try {
        await use(database);
      } finally {
        await database.$client.end();
      }
    },
    { scope: 'worker' },
  ],
});
