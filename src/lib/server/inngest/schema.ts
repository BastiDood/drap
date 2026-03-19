import * as v from 'valibot';
import { eventType } from 'inngest';

export const RoundStartedEvent = v.object({
  draftId: v.number(),
  round: v.nullable(v.number()),
  recipientEmail: v.string(),
  recipientName: v.string(),
});
export type RoundStartedEvent = v.InferOutput<typeof RoundStartedEvent>;

export const RoundSubmittedEvent = v.object({
  draftId: v.number(),
  round: v.number(),
  labId: v.string(),
  labName: v.string(),
  recipientEmail: v.string(),
});
export type RoundSubmittedEvent = v.InferOutput<typeof RoundSubmittedEvent>;

export const LotteryInterventionEvent = v.object({
  draftId: v.number(),
  labId: v.string(),
  labName: v.string(),
  studentName: v.string(),
  studentEmail: v.string(),
  recipientEmail: v.string(),
  recipientName: v.string(),
});
export type LotteryInterventionEvent = v.InferOutput<typeof LotteryInterventionEvent>;

export const DraftFinalizedEvent = v.object({
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
});
export type DraftFinalizedEvent = v.InferOutput<typeof DraftFinalizedEvent>;

export const UserAssignedEvent = v.object({
  labId: v.string(),
  labName: v.string(),
  userEmail: v.string(),
  userName: v.string(),
});
export type UserAssignedEvent = v.InferOutput<typeof UserAssignedEvent>;

export const roundStartedEvent = eventType('draft/round.started', {
  schema: RoundStartedEvent,
});

export const roundSubmittedEvent = eventType('draft/round.submitted', {
  schema: RoundSubmittedEvent,
});

export const lotteryInterventionEvent = eventType('draft/lottery.intervened', {
  schema: LotteryInterventionEvent,
});

export const draftFinalizedEvent = eventType('draft/draft.finalized', {
  schema: DraftFinalizedEvent,
});

export const userAssignedEvent = eventType('draft/user.assigned', {
  schema: UserAssignedEvent,
});
