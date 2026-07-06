import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftInterventionsAggregate } from './http';

export function createFetchDraftInterventionsAggregateQuery(draftId: string) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'interventions-aggregate'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftInterventionsAggregate(id);
    },
  }));
}
