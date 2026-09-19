import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftees } from './http';
import type { Draftees } from './schema';

export function createFetchDrafteesQuery(draftId: string, select?: (data: Draftees) => Draftees) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'draftees'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftees(id);
    },
    select,
  }));
}
