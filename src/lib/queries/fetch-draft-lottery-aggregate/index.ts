import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftLotteryAggregate } from './http';

export function createFetchDraftLotteryAggregateQuery(draftId: string) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'lottery-aggregate'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftLotteryAggregate(id);
    },
  }));
}
