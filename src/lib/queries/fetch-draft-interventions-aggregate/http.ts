import * as v from 'valibot';

import { DraftInterventionsAggregate } from './schema';

export async function fetchDraftInterventionsAggregate(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/interventions-aggregate`);
  if (!response.ok) throw new Error('Failed to fetch draft interventions aggregate.');

  const json = await response.json();
  return v.parse(DraftInterventionsAggregate, json);
}
