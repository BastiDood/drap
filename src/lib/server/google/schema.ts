import * as v from 'valibot';

export const TokenResponse = v.object({
  access_token: v.string(),
  // Refresh token, will not always be given with every TokenResponse (requires prompt=consent&access_type=offline)
  refresh_token: v.optional(v.string()),
  // Always set to `OAUTH_SCOPE` for now.
  scope: v.pipe(
    v.string(),
    v.transform(str => str.split(' ')),
  ),
  token_type: v.literal('Bearer'),
  // Remaining lifetime in seconds.
  expires_in: v.pipe(v.number(), v.safeInteger()),
});
export type TokenResponse = v.InferOutput<typeof TokenResponse>;

export const GmailMessageSendResult = v.object({
  id: v.string(),
  threadId: v.string(),
  labelIds: v.array(v.string()),
});
export type GmailMessageSendResult = v.InferOutput<typeof GmailMessageSendResult>;
