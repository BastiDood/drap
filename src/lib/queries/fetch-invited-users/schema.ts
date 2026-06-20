import * as v from 'valibot';

export const InvitedUser = v.object({
  id: v.string(),
  email: v.string(),
  givenName: v.string(),
  familyName: v.string(),
  avatarUrl: v.string(),
  labId: v.nullable(v.string()),
  labName: v.nullable(v.string()),
});
export type InvitedUser = v.InferOutput<typeof InvitedUser>;

export const FetchInvitedUsersResponse = v.array(InvitedUser);
export type FetchInvitedUsersResponse = v.InferOutput<typeof FetchInvitedUsersResponse>;
