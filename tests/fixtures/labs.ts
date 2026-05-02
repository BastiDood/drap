import * as schema from '$lib/server/database/schema';

import { testDatabase } from './database';

export const testLabs = testDatabase.extend<object, { labs: void }>({
  labs: [
    async ({ database }, use) => {
      // Totally random labs with zero bias whatsoever...
      await database.insert(schema.lab).values([
        { id: 'ndsl', name: 'Networks and Distributed Systems Laboratory' },
        { id: 'csl', name: 'Computer Security Laboratory' },
        { id: 'scl', name: 'Scientific Computing Laboratory' },
        { id: 'cvmil', name: 'Computer Vision and Machine Intelligence Laboratory' },
        { id: 'acl', name: 'Algorithms and Complexity Laboratory' },
      ]);
      await use();
    },
    { scope: 'worker' },
  ],
});
