import * as devalue from 'devalue';
import * as v from 'valibot';

import { DraftAllowlistEntries } from './schema';

export async function fetchDraftAllowlist(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/allowlist`);
  if (!response.ok) throw new Error('Failed to fetch draft allowlist.');

  const serialized = await response.text();
  return v.parse(DraftAllowlistEntries, devalue.parse(serialized));
}
