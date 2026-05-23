import * as v from 'valibot';
import { eventType } from 'inngest';

const EmailAttempt = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)));

export const RoundStartedBatchEmailEvent = eventType('draft/round.started.email.batch', {
  schema: v.object({
    draftId: v.number(),
    round: v.nullable(v.number()),
    recipientEmail: v.string(),
    recipientName: v.string(),
    attempt: EmailAttempt,
  }),
});
export type RoundStartedBatchEmailSchema = v.InferOutput<typeof RoundStartedBatchEmailEvent.schema>;

export const RoundStartedFallbackEmailEvent = eventType('draft/round.started.email.fallback', {
  schema: v.object({
    id: v.string(),
    draftId: v.number(),
    round: v.nullable(v.number()),
    recipientEmail: v.string(),
    recipientName: v.string(),
  }),
});
export type RoundStartedFallbackEmailSchema = v.InferOutput<
  typeof RoundStartedFallbackEmailEvent.schema
>;

export const RoundSubmittedBatchEmailEvent = eventType('draft/round.submitted.email.batch', {
  schema: v.object({
    draftId: v.number(),
    round: v.number(),
    labId: v.string(),
    labName: v.string(),
    recipientEmail: v.string(),
    isCreate: v.boolean(),
    attempt: EmailAttempt,
  }),
});
export type RoundSubmittedBatchEmailSchema = v.InferOutput<
  typeof RoundSubmittedBatchEmailEvent.schema
>;

export const RoundSubmittedFallbackEmailEvent = eventType('draft/round.submitted.email.fallback', {
  schema: v.object({
    id: v.string(),
    draftId: v.number(),
    round: v.number(),
    labId: v.string(),
    labName: v.string(),
    recipientEmail: v.string(),
    isCreate: v.boolean(),
  }),
});
export type RoundSubmittedFallbackEmailSchema = v.InferOutput<
  typeof RoundSubmittedFallbackEmailEvent.schema
>;

export const LotteryInterventionBatchEmailEvent = eventType(
  'draft/lottery.intervened.email.batch',
  {
    schema: v.object({
      draftId: v.number(),
      labId: v.string(),
      labName: v.string(),
      studentName: v.string(),
      studentEmail: v.string(),
      avatarUrl: v.string(),
      recipientEmail: v.string(),
      recipientName: v.string(),
      attempt: EmailAttempt,
    }),
  },
);
export type LotteryInterventionBatchEmailSchema = v.InferOutput<
  typeof LotteryInterventionBatchEmailEvent.schema
>;

export const LotteryInterventionFallbackEmailEvent = eventType(
  'draft/lottery.intervened.email.fallback',
  {
    schema: v.object({
      id: v.string(),
      draftId: v.number(),
      labId: v.string(),
      labName: v.string(),
      studentName: v.string(),
      studentEmail: v.string(),
      avatarUrl: v.string(),
      recipientEmail: v.string(),
      recipientName: v.string(),
    }),
  },
);
export type LotteryInterventionFallbackEmailSchema = v.InferOutput<
  typeof LotteryInterventionFallbackEmailEvent.schema
>;

export const DraftConcludedBatchEmailEvent = eventType('draft/draft.concluded.email.batch', {
  schema: v.object({
    draftId: v.number(),
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
    attempt: EmailAttempt,
  }),
});
export type DraftConcludedBatchEmailSchema = v.InferOutput<
  typeof DraftConcludedBatchEmailEvent.schema
>;

export const DraftConcludedFallbackEmailEvent = eventType('draft/draft.concluded.email.fallback', {
  schema: v.object({
    id: v.string(),
    draftId: v.number(),
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
export type DraftConcludedFallbackEmailSchema = v.InferOutput<
  typeof DraftConcludedFallbackEmailEvent.schema
>;

export const DraftFinalizationBatchEmailEvent = eventType('draft/draft.finalization.email.batch', {
  schema: v.object({
    draftId: v.number(),
    recipientEmail: v.string(),
    recipientName: v.string(),
    attempt: EmailAttempt,
  }),
});
export type DraftFinalizationBatchEmailSchema = v.InferOutput<
  typeof DraftFinalizationBatchEmailEvent.schema
>;

export const DraftFinalizationFallbackEmailEvent = eventType(
  'draft/draft.finalization.email.fallback',
  {
    schema: v.object({
      id: v.string(),
      draftId: v.number(),
      recipientEmail: v.string(),
      recipientName: v.string(),
    }),
  },
);
export type DraftFinalizationFallbackEmailSchema = v.InferOutput<
  typeof DraftFinalizationFallbackEmailEvent.schema
>;

export const UserAssignedBatchEmailEvent = eventType('draft/user.assigned.email.batch', {
  schema: v.object({
    labId: v.string(),
    labName: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    attempt: EmailAttempt,
  }),
});
export type UserAssignedBatchEmailSchema = v.InferOutput<typeof UserAssignedBatchEmailEvent.schema>;

export const UserAssignedFallbackEmailEvent = eventType('draft/user.assigned.email.fallback', {
  schema: v.object({
    id: v.string(),
    labId: v.string(),
    labName: v.string(),
    userEmail: v.string(),
    userName: v.string(),
  }),
});
export type UserAssignedFallbackEmailSchema = v.InferOutput<
  typeof UserAssignedFallbackEmailEvent.schema
>;
