import assert from 'node:assert/strict';
import { env } from 'node:process';

import { test } from '@playwright/test';

import { type DrizzleDatabase, init } from '$lib/server/database/drizzle';

assert(env.POSTGRES_URL, 'POSTGRES_URL must be set');
const url = env.POSTGRES_URL;

export const testDatabase = test.extend<object, { database: DrizzleDatabase }>({
  database: [
    async (_, use) => {
      const db = init(url);
      await use(db);
      await db.$client.end();
    },
    { scope: 'worker' },
  ],
});
