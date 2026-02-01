import { test } from '@playwright/test';

import { db, dropLabs, insertNewLabs } from '$lib/server/database';

export const testLabs = test.extend<object, { labs: void }>({
  labs: [
    async (_, use) => {
      // Totally random labs with zero bias whatsoever...
      await insertNewLabs(db, [
        { id: 'ndsl', name: 'Networks and Distributed Systems Laboratory' },
        { id: 'csl', name: 'Computer Security Laboratory' },
        { id: 'scl', name: 'Scientific Computing Laboratory' },
      ]);
      await use();
      await dropLabs(db, ['ndsl', 'csl', 'scl']);
    },
    { scope: 'worker' },
  ],
});
