import { type InferOutput, array, object, string } from 'valibot';

export const GmailMessageSendResult = object({
  id: string(),
  threadId: string(),
  labelIds: array(string()),
});

export type GmailMessageSendResult = InferOutput<typeof GmailMessageSendResult>;
