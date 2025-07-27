import { array, email, type InferOutput, object, pipe, string } from 'valibot';

export const GmailMessageSendResult = object({
  id: string(),
  threadId: string(),
  labelIds: array(string()),
});

export type GmailMessageSendResult = InferOutput<typeof GmailMessageSendResult>;

export const EmailSendRequest = object({
  to: array(pipe(string(), email())),
  subject: string(),
  data: string(),
});

export type EmailSendRequest = InferOutput<typeof EmailSendRequest>;
