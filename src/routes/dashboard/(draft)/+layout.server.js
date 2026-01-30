import { db, getActiveDraft } from '$lib/server/database';

export async function load() {
  return {
    draft: await getActiveDraft(db),
    requestedAt: new Date(),
  };
}
