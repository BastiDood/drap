import { createQuery } from '@tanstack/svelte-query';

import type { Draftees } from './schema';
import { fetchDraftees } from './http';

export function createFetchDrafteesQuery(draftId: string, select?: (data: Draftees) => Draftees) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'draftees'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftees(id);
    },
    select,
  }));
}
