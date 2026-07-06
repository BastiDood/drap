import * as v from 'valibot';

import { RegistrationTimestamps } from './schema';

export async function fetchDraftRegistrationTimestamps(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/registration-timestamps`);
  if (!response.ok) throw new Error('Failed to fetch registration timestamps.');

  const json = await response.json();
  return v.parse(RegistrationTimestamps, json);
}
