import * as v from 'valibot';
import { eventType } from 'inngest';

const EmailAttempt = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)));
const GmailMessageId = v.pipe(v.string(), v.uuid());

const RoundStartedSeedEmailSchema = v.object({
  draftId: v.number(),
  draftYear: v.number(),
  round: v.nullable(v.number()),
  recipientUserId: v.string(),
  recipientEmail: v.string(),
  recipientName: v.string(),
  attempt: EmailAttempt,
});

const RoundStartedBatchEmailSchema = v.object({
  ...RoundStartedSeedEmailSchema.entries,
  gmailMessageId: GmailMessageId,
});

export const RoundStartedSeedEmailEvent = eventType('draft/round.started.email.seed', {
  schema: RoundStartedSeedEmailSchema,
});
export type RoundStartedSeedEmailSchema = v.InferOutput<typeof RoundStartedSeedEmailSchema>;

export const RoundStartedBatchEmailEvent = eventType('draft/round.started.email.batch', {
  schema: RoundStartedBatchEmailSchema,
});
export type RoundStartedBatchEmailSchema = v.InferOutput<typeof RoundStartedBatchEmailSchema>;

const RoundSubmittedSeedEmailSchema = v.object({
  draftId: v.number(),
  draftYear: v.number(),
  round: v.number(),
  labId: v.string(),
  labName: v.string(),
  recipientUserId: v.string(),
  recipientEmail: v.string(),
  isCreate: v.boolean(),
  attempt: EmailAttempt,
});

const RoundSubmittedBatchEmailSchema = v.object({
  ...RoundSubmittedSeedEmailSchema.entries,
  gmailMessageId: GmailMessageId,
});

export const RoundSubmittedSeedEmailEvent = eventType('draft/round.submitted.email.seed', {
  schema: RoundSubmittedSeedEmailSchema,
});
export type RoundSubmittedSeedEmailSchema = v.InferOutput<typeof RoundSubmittedSeedEmailSchema>;

export const RoundSubmittedBatchEmailEvent = eventType('draft/round.submitted.email.batch', {
  schema: RoundSubmittedBatchEmailSchema,
});
export type RoundSubmittedBatchEmailSchema = v.InferOutput<typeof RoundSubmittedBatchEmailSchema>;

const LotteryInterventionSeedEmailSchema = v.object({
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
  attempt: EmailAttempt,
});

const LotteryInterventionBatchEmailSchema = v.object({
  ...LotteryInterventionSeedEmailSchema.entries,
  gmailMessageId: GmailMessageId,
});

export const LotteryInterventionSeedEmailEvent = eventType('draft/lottery.intervened.email.seed', {
  schema: LotteryInterventionSeedEmailSchema,
});
export type LotteryInterventionSeedEmailSchema = v.InferOutput<
  typeof LotteryInterventionSeedEmailSchema
>;

export const LotteryInterventionBatchEmailEvent = eventType(
  'draft/lottery.intervened.email.batch',
  {
    schema: LotteryInterventionBatchEmailSchema,
  },
);
export type LotteryInterventionBatchEmailSchema = v.InferOutput<
  typeof LotteryInterventionBatchEmailSchema
>;

const LotteryAssignmentSchema = v.object({
  labId: v.string(),
  labName: v.string(),
  studentName: v.string(),
  studentEmail: v.string(),
  avatarUrl: v.string(),
});

const DraftConcludedSeedEmailSchema = v.object({
  draftId: v.number(),
  draftYear: v.number(),
  recipientUserId: v.string(),
  recipientEmail: v.string(),
  recipientName: v.string(),
  lotteryAssignments: v.array(LotteryAssignmentSchema),
  attempt: EmailAttempt,
});

const DraftConcludedBatchEmailSchema = v.object({
  ...DraftConcludedSeedEmailSchema.entries,
  gmailMessageId: GmailMessageId,
});

export const DraftConcludedSeedEmailEvent = eventType('draft/draft.concluded.email.seed', {
  schema: DraftConcludedSeedEmailSchema,
});
export type DraftConcludedSeedEmailSchema = v.InferOutput<typeof DraftConcludedSeedEmailSchema>;

export const DraftConcludedBatchEmailEvent = eventType('draft/draft.concluded.email.batch', {
  schema: DraftConcludedBatchEmailSchema,
});
export type DraftConcludedBatchEmailSchema = v.InferOutput<typeof DraftConcludedBatchEmailSchema>;

const DraftFinalizationSeedEmailSchema = v.object({
  draftId: v.number(),
  draftYear: v.number(),
  recipientUserId: v.string(),
  recipientEmail: v.string(),
  recipientName: v.string(),
  attempt: EmailAttempt,
});

const DraftFinalizationBatchEmailSchema = v.object({
  ...DraftFinalizationSeedEmailSchema.entries,
  gmailMessageId: GmailMessageId,
});

export const DraftFinalizationSeedEmailEvent = eventType('draft/draft.finalization.email.seed', {
  schema: DraftFinalizationSeedEmailSchema,
});
export type DraftFinalizationSeedEmailSchema = v.InferOutput<
  typeof DraftFinalizationSeedEmailSchema
>;

export const DraftFinalizationBatchEmailEvent = eventType('draft/draft.finalization.email.batch', {
  schema: DraftFinalizationBatchEmailSchema,
});
export type DraftFinalizationBatchEmailSchema = v.InferOutput<
  typeof DraftFinalizationBatchEmailSchema
>;

const UserAssignedSeedEmailSchema = v.object({
  draftId: v.number(),
  labId: v.string(),
  labName: v.string(),
  recipientUserId: v.string(),
  userEmail: v.string(),
  userName: v.string(),
  attempt: EmailAttempt,
});

const UserAssignedBatchEmailSchema = v.object({
  ...UserAssignedSeedEmailSchema.entries,
  gmailMessageId: GmailMessageId,
});

export const UserAssignedSeedEmailEvent = eventType('draft/user.assigned.email.seed', {
  schema: UserAssignedSeedEmailSchema,
});
export type UserAssignedSeedEmailSchema = v.InferOutput<typeof UserAssignedSeedEmailSchema>;

export const UserAssignedBatchEmailEvent = eventType('draft/user.assigned.email.batch', {
  schema: UserAssignedBatchEmailSchema,
});
export type UserAssignedBatchEmailSchema = v.InferOutput<typeof UserAssignedBatchEmailSchema>;

export const EmailBatchEnvelopeSchema = v.variant('name', [
  v.object({
    name: v.literal('draft/round.started.email.batch'),
    data: RoundStartedBatchEmailSchema,
  }),
  v.object({
    name: v.literal('draft/round.submitted.email.batch'),
    data: RoundSubmittedBatchEmailSchema,
  }),
  v.object({
    name: v.literal('draft/lottery.intervened.email.batch'),
    data: LotteryInterventionBatchEmailSchema,
  }),
  v.object({
    name: v.literal('draft/draft.concluded.email.batch'),
    data: DraftConcludedBatchEmailSchema,
  }),
  v.object({
    name: v.literal('draft/draft.finalization.email.batch'),
    data: DraftFinalizationBatchEmailSchema,
  }),
  v.object({
    name: v.literal('draft/user.assigned.email.batch'),
    data: UserAssignedBatchEmailSchema,
  }),
]);
export type EmailBatchEnvelopeSchema = v.InferOutput<typeof EmailBatchEnvelopeSchema>;

export const EmailSeedFallbackEvent = eventType('email/seed.fallback', {
  schema: v.object({
    seed: EmailBatchEnvelopeSchema,
    followers: v.array(EmailBatchEnvelopeSchema),
    attempt: EmailAttempt,
  }),
});
export type EmailSeedFallbackSchema = v.InferOutput<typeof EmailSeedFallbackEvent.schema>;

export const EmailBatchFallbackEvent = eventType('email/batch.fallback', {
  schema: v.object({
    email: EmailBatchEnvelopeSchema,
  }),
});
export type EmailBatchFallbackSchema = v.InferOutput<typeof EmailBatchFallbackEvent.schema>;
