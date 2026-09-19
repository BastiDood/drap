import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftAllowlist } from './http';
import type { DraftAllowlistEntries } from './schema';

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
