import * as v from 'valibot';
import { eventType } from 'inngest';

export const RoundStartedEvent = eventType('draft/round.started', {
  schema: v.object({
    draftId: v.number(),
    round: v.nullable(v.number()),
    recipientEmail: v.string(),
    recipientName: v.string(),
  }),
});
export type RoundStartedSchema = v.InferOutput<typeof RoundStartedEvent.schema>;

export const RoundSubmittedEvent = eventType('draft/round.submitted', {
  schema: v.object({
    draftId: v.number(),
    round: v.number(),
    labId: v.string(),
    labName: v.string(),
    recipientEmail: v.string(),
  }),
});
export type RoundSubmittedSchema = v.InferOutput<typeof RoundSubmittedEvent.schema>;

export const LotteryInterventionEvent = eventType('draft/lottery.intervened', {
  schema: v.object({
    draftId: v.number(),
    labId: v.string(),
    labName: v.string(),
    studentName: v.string(),
    studentEmail: v.string(),
    recipientEmail: v.string(),
    recipientName: v.string(),
  }),
});
export type LotteryInterventionSchema = v.InferOutput<typeof LotteryInterventionEvent.schema>;

export const DraftFinalizedEvent = eventType('draft/draft.finalized', {
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
      }),
    ),
  }),
});
export type DraftFinalizedSchema = v.InferOutput<typeof DraftFinalizedEvent.schema>;

export const UserAssignedEvent = eventType('draft/user.assigned', {
  schema: v.object({
    labId: v.string(),
    labName: v.string(),
    userEmail: v.string(),
    userName: v.string(),
  }),
});
export type UserAssignedSchema = v.InferOutput<typeof UserAssignedEvent.schema>;
