import { db } from '$lib/server/database';
import { getActiveDraft, getCandidateSenders } from '$lib/server/database/drizzle';

export async function load() {
  const [draft, candidateSenders] = await Promise.all([
    getActiveDraft(db),
    getCandidateSenders(db),
  ]);
  return {
    draft,
    candidateSenders,
  };
}
