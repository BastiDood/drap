import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftAssignments } from './http';
import type { DraftAssignmentRecords } from './schema';

export function createFetchDraftAssignmentsQuery(
  draftId: string,
  select?: (data: DraftAssignmentRecords) => DraftAssignmentRecords,
) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'assignments'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftAssignments(id);
    },
    select,
  }));
}
