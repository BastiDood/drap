import * as v from 'valibot';

import { DraftAssignmentSummary } from './schema';

export async function fetchDraftAssignmentSummary(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/assignment-summary`);
  if (!response.ok) throw new Error('Failed to fetch draft assignment summary.');

  const json = await response.json();
  return v.parse(DraftAssignmentSummary, json);
}
