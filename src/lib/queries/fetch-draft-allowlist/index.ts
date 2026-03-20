import { createQuery } from '@tanstack/svelte-query';

import type { DraftAllowlistEntries } from './schema';
import { fetchDraftAllowlist } from './http';

export function createFetchDraftAllowlistQuery(
  draftId: string,
  select?: (data: DraftAllowlistEntries) => DraftAllowlistEntries,
) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'allowlist'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftAllowlist(id);
    },
    select,
  }));
}
