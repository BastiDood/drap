import * as v from 'valibot';
import { eventType } from 'inngest';

export const RoundStartedSeedEmailEvent = eventType('draft/round.started.email.seed', {
  schema: v.object({
    draftId: v.number(),
    draftYear: v.number(),
    round: v.nullable(v.number()),
    recipientUserId: v.string(),
    recipientEmail: v.string(),
    recipientName: v.string(),
  }),
});

export const RoundSubmittedSeedEmailEvent = eventType('draft/round.submitted.email.seed', {
  schema: v.object({
    draftId: v.number(),
    draftYear: v.number(),
    round: v.number(),
    labId: v.string(),
    labName: v.string(),
    recipientUserId: v.string(),
    recipientEmail: v.string(),
    isCreate: v.boolean(),
  }),
});

export const LotteryInterventionSeedEmailEvent = eventType('draft/lottery.intervened.email.seed', {
  schema: v.object({
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
});

export const DraftConcludedSeedEmailEvent = eventType('draft/draft.concluded.email.seed', {
  schema: v.object({
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
});

export const DraftFinalizationSeedEmailEvent = eventType('draft/draft.finalization.email.seed', {
  schema: v.object({
    draftId: v.number(),
    draftYear: v.number(),
    recipientUserId: v.string(),
    recipientEmail: v.string(),
    recipientName: v.string(),
  }),
});

export const UserAssignedSeedEmailEvent = eventType('draft/user.assigned.email.seed', {
  schema: v.object({
    draftId: v.number(),
    labId: v.string(),
    labName: v.string(),
    recipientUserId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
  }),
});

const EmailEnvelopeSchema = v.variant('name', [
  v.object({
    name: v.literal('draft/round.started.email.seed'),
    data: RoundStartedSeedEmailEvent.schema,
  }),
  v.object({
    name: v.literal('draft/round.submitted.email.seed'),
    data: RoundSubmittedSeedEmailEvent.schema,
  }),
  v.object({
    name: v.literal('draft/lottery.intervened.email.seed'),
    data: LotteryInterventionSeedEmailEvent.schema,
  }),
  v.object({
    name: v.literal('draft/draft.concluded.email.seed'),
    data: DraftConcludedSeedEmailEvent.schema,
  }),
  v.object({
    name: v.literal('draft/draft.finalization.email.seed'),
    data: DraftFinalizationSeedEmailEvent.schema,
  }),
  v.object({
    name: v.literal('draft/user.assigned.email.seed'),
    data: UserAssignedSeedEmailEvent.schema,
  }),
]);

export const EmailSeedEvent = eventType('email.seed', {
  schema: v.object({
    gmailThreadRowId: v.pipe(v.number(), v.integer(), v.minValue(1)),
    seed: EmailEnvelopeSchema,
    followers: v.array(EmailEnvelopeSchema),
    attempt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
});

export const EmailBatchEvent = eventType('email.batch', {
  schema: v.object({
    gmailThreadRowId: v.pipe(v.number(), v.integer(), v.minValue(1)),
    email: EmailEnvelopeSchema,
    attempt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
});

export const EmailSeedFallbackEvent = eventType('email.seed.fallback', {
  schema: EmailSeedEvent.schema,
});

export const EmailBatchFallbackEvent = eventType('email.batch.fallback', {
  schema: EmailBatchEvent.schema,
});
