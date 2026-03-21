import * as devalue from 'devalue';
import * as v from 'valibot';

import { Draftees } from './schema';

export async function fetchDraftees(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/draftees`);
  if (!response.ok) throw new Error('Failed to fetch draftee list.');

  const serialized = await response.text();
  return v.parse(Draftees, devalue.parse(serialized));
}
