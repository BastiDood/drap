import { type InferOutput, array, object, string } from 'valibot';

export const GmailMessageSendResult = object({
  id: string(),
  threadId: string(),
  labelIds: array(string()),
});

export type GmailMessageSendResult = InferOutput<typeof GmailMessageSendResult>;

export const EmailSendRequest = object({
  to: array(string()),
  subject: string(),
  data: string(),
});

export type EmailSendRequest = InferOutput<typeof EmailSendRequest>;
