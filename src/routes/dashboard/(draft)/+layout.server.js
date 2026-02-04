import { db } from '$lib/server/database';
import { getActiveDraft } from '$lib/server/database/drizzle';

export async function load() {
  return {
    draft: await getActiveDraft(db),
    requestedAt: new Date(),
  };
}
