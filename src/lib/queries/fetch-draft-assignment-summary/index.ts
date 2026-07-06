import { createQuery } from '@tanstack/svelte-query';

import type { DraftAssignmentSummary } from './schema';
import { fetchDraftAssignmentSummary } from './http';

export function createFetchDraftAssignmentSummaryQuery(
  draftId: string,
  initialAssignmentSummary: DraftAssignmentSummary | null = null,
) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'assignment-summary'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftAssignmentSummary(id);
    },
    initialData: initialAssignmentSummary === null ? void 0 : initialAssignmentSummary,
  }));
}
