import * as v from 'valibot';

import { DraftLotteryAggregate } from './schema';

export async function fetchDraftLotteryAggregate(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/lottery-aggregate`);
  if (!response.ok) throw new Error('Failed to fetch draft lottery aggregate.');

  const json = await response.json();
  return v.parse(DraftLotteryAggregate, json);
}
