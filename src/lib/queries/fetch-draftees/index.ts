import { createQuery } from '@tanstack/svelte-query';

import type { Student } from '$lib/features/drafts/types';

import type { Draftees } from './schema';
import { fetchDraftees } from './http';

export function createFetchDrafteesQuery(draftId: string, select?: (data: Draftees) => Draftees) {
  return createQuery(() => ({
    queryKey: ['drafts', 'fetch-draftees', draftId] as const,
    async queryFn({ queryKey: [, , id] }) {
      return await fetchDraftees(id);
    },
    select,
  }));
}

export function selectUndraftedAfterRegular(students: Student[], regularDraftedIds: Set<string>) {
  return students.filter(({ id }) => !regularDraftedIds.has(id));
}
