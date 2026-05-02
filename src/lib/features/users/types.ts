import type { schema } from '$lib/server/database/drizzle';

export const enum SenderRole {
  None = 'none',
  Candidate = 'candidate',
  Designated = 'designated',
}

export type RegisteredAdmin = Pick<
  schema.User,
  'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl'
>;

export interface CandidateSenderEntry extends Pick<
  schema.User,
  'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl'
> {
  isActive: boolean;
}

export function deriveSenderRole(
  userId: schema.User['id'],
  candidateSenders: readonly CandidateSenderEntry[],
) {
  const entry = candidateSenders.find(({ id }) => id === userId);
  if (typeof entry === 'undefined') return SenderRole.None;
  return entry.isActive ? SenderRole.Designated : SenderRole.Candidate;
}
