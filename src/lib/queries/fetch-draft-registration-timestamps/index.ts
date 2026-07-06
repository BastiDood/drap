import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftRegistrationTimestamps } from './http';

export function createFetchDraftRegistrationTimestampsQuery(draftId: string) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'registration-timestamps'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftRegistrationTimestamps(id);
    },
  }));
}
