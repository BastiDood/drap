import { test } from '@playwright/test';

import { createTestDatabase, resetTestDatabase } from './fixtures/database';
import { seedE2eLabs } from './fixtures/labs';
import { seedE2eUsers } from './fixtures/users';

test('resets and seeds the E2E database', async () => {
  const database = createTestDatabase();
  try {
    await resetTestDatabase(database);
    await database.transaction(async transaction => {
      await seedE2eLabs(transaction);
      await seedE2eUsers(transaction);
    });
  } finally {
    await database.$client.end();
  }
});
