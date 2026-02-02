import { dropLabs, insertNewLabs } from '$lib/server/database/drizzle';

import { testDatabase } from './database';

export const testLabs = testDatabase.extend<object, { labs: void }>({
  labs: [
    async ({ database }, use) => {
      // Totally random labs with zero bias whatsoever...
      await insertNewLabs(database, [
        { id: 'ndsl', name: 'Networks and Distributed Systems Laboratory' },
        { id: 'csl', name: 'Computer Security Laboratory' },
        { id: 'scl', name: 'Scientific Computing Laboratory' },
      ]);
      await use();
      await dropLabs(database, ['ndsl', 'csl', 'scl']);
    },
    { scope: 'worker' },
  ],
});
