import * as v from 'valibot';
import { eventType } from 'inngest';

export const EmailEvent = eventType('draft/email', {
  schema: v.variant('name', [
    v.object({
      name: v.literal('round-started'),
      data: v.object({
        draftId: v.number(),
        draftYear: v.number(),
        round: v.nullable(v.number()),
        recipientUserId: v.string(),
        recipientEmail: v.string(),
        recipientName: v.string(),
      }),
    }),
    v.object({
      name: v.literal('round-submitted'),
      data: v.object({
        draftId: v.number(),
        draftYear: v.number(),
        round: v.number(),
        labId: v.string(),
        labName: v.string(),
        recipientUserId: v.string(),
        recipientEmail: v.string(),
        isCreate: v.boolean(),
      }),
    }),
    v.object({
      name: v.literal('lottery-intervened'),
      data: v.object({
        draftId: v.number(),
        draftYear: v.number(),
        labId: v.string(),
        labName: v.string(),
        studentName: v.string(),
        studentEmail: v.string(),
        avatarUrl: v.string(),
        recipientUserId: v.string(),
        recipientEmail: v.string(),
        recipientName: v.string(),
      }),
    }),
    v.object({
      name: v.literal('draft-concluded'),
      data: v.object({
        draftId: v.number(),
        draftYear: v.number(),
        recipientUserId: v.string(),
        recipientEmail: v.string(),
        recipientName: v.string(),
        lotteryAssignments: v.array(
          v.object({
            labId: v.string(),
            labName: v.string(),
            studentName: v.string(),
            studentEmail: v.string(),
            avatarUrl: v.string(),
          }),
        ),
      }),
    }),
    v.object({
      name: v.literal('draft-finalization'),
      data: v.object({
        draftId: v.number(),
        draftYear: v.number(),
        recipientUserId: v.string(),
        recipientEmail: v.string(),
        recipientName: v.string(),
      }),
    }),
    v.object({
      name: v.literal('user-assigned'),
      data: v.object({
        draftId: v.number(),
        labId: v.string(),
        labName: v.string(),
        recipientUserId: v.string(),
        userEmail: v.string(),
        userName: v.string(),
      }),
    }),
  ]),
});
export type EmailEvent = v.InferOutput<typeof EmailEvent.schema>;

export const EmailSeedEvent = eventType('email.seed', {
  schema: v.object({
    gmailThreadRowId: v.pipe(v.number(), v.integer(), v.minValue(1)),
    seed: EmailEvent.schema,
    followers: v.array(EmailEvent.schema),
    attempt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
});
export type EmailSeedEvent = v.InferOutput<typeof EmailSeedEvent.schema>;

export const EmailBatchEvent = eventType('email.batch', {
  schema: v.object({
    gmailThreadRowId: v.pipe(v.number(), v.integer(), v.minValue(1)),
    email: EmailEvent.schema,
    attempt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
});
export type EmailBatchEvent = v.InferOutput<typeof EmailBatchEvent.schema>;

export const EmailSeedFallbackEvent = eventType('email.seed.fallback', {
  schema: EmailSeedEvent.schema,
});
export type EmailSeedFallbackEvent = v.InferOutput<typeof EmailSeedFallbackEvent.schema>;

export const EmailBatchFallbackEvent = eventType('email.batch.fallback', {
  schema: EmailBatchEvent.schema,
});
export type EmailBatchFallbackEvent = v.InferOutput<typeof EmailBatchFallbackEvent.schema>;
