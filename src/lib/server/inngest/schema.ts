import * as v from 'valibot';
import { eventType } from 'inngest';

const EmailAttempt = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)));

export const RoundStartedEvent = eventType('draft/round.started', {
  schema: v.object({
    draftId: v.number(),
    round: v.nullable(v.number()),
    recipientEmail: v.string(),
    recipientName: v.string(),
    attempt: EmailAttempt,
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
    attempt: EmailAttempt,
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
    attempt: EmailAttempt,
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
    attempt: EmailAttempt,
  }),
});
export type DraftFinalizedSchema = v.InferOutput<typeof DraftFinalizedEvent.schema>;

export const UserAssignedEvent = eventType('draft/user.assigned', {
  schema: v.object({
    labId: v.string(),
    labName: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    attempt: EmailAttempt,
  }),
});
export type UserAssignedSchema = v.InferOutput<typeof UserAssignedEvent.schema>;

export const EmailSingleSendRequestedEvent = eventType('draft/email.single-send.requested', {
  schema: v.variant('name', [
    v.object({
      id: v.string(),
      name: v.literal('draft/round.started'),
      data: v.omit(RoundStartedEvent.schema, ['attempt']),
    }),
    v.object({
      id: v.string(),
      name: v.literal('draft/round.submitted'),
      data: v.omit(RoundSubmittedEvent.schema, ['attempt']),
    }),
    v.object({
      id: v.string(),
      name: v.literal('draft/lottery.intervened'),
      data: v.omit(LotteryInterventionEvent.schema, ['attempt']),
    }),
    v.object({
      id: v.string(),
      name: v.literal('draft/draft.finalized'),
      data: v.omit(DraftFinalizedEvent.schema, ['attempt']),
    }),
    v.object({
      id: v.string(),
      name: v.literal('draft/user.assigned'),
      data: v.omit(UserAssignedEvent.schema, ['attempt']),
    }),
  ]),
});
export type EmailSingleSendRequestedSchema = v.InferOutput<
  typeof EmailSingleSendRequestedEvent.schema
>;
