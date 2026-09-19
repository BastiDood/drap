import type { DbConnection } from '$lib/server/database/drizzle';
import * as schema from '$lib/server/database/schema';

export const e2eLabs = [
  { id: 'ndsl', name: 'Networks and Distributed Systems Laboratory' },
  { id: 'csl', name: 'Computer Security Laboratory' },
  { id: 'scl', name: 'Scientific Computing Laboratory' },
  { id: 'cvmil', name: 'Computer Vision and Machine Intelligence Laboratory' },
  { id: 'acl', name: 'Algorithms and Complexity Laboratory' },
];

export async function seedE2eLabs(database: DbConnection) {
  await database.insert(schema.lab).values(e2eLabs);
}
