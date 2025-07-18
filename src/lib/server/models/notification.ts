import {
  type InferOutput,
  bigint,
  literal,
  nullable,
  number,
  object,
  string,
  variant,
} from 'valibot';

const BaseDraftNotification = object({
  target: literal('Draft'),
  draftId: bigint(),
  round: nullable(number()),
});
export type BaseDraftNotification = InferOutput<typeof BaseDraftNotification>;

const DraftRoundStartedNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('RoundStart'),
});
export type DraftRoundStartedNotification = InferOutput<typeof DraftRoundStartedNotification>;

const DraftRoundSubmittedNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('RoundSubmit'),
  labId: string(),
});
export type DraftRoundSubmittedNotification = InferOutput<typeof DraftRoundSubmittedNotification>;

const DraftLotteryInterventionNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('LotteryIntervention'),
  labId: string(),
  userId: string(),
});
export type DraftLotteryInterventionNotification = InferOutput<
  typeof DraftLotteryInterventionNotification
>;

const DraftConcludedNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('Concluded'),
});
export type DraftConcludedNotification = InferOutput<typeof DraftConcludedNotification>;

const BaseUserNotification = object({
  target: literal('User'),
  userId: string(),
  labId: string(),
});
export type BaseUserNotification = InferOutput<typeof BaseUserNotification>;

export const DraftNotification = variant('type', [
  DraftRoundStartedNotification,
  DraftRoundSubmittedNotification,
  DraftLotteryInterventionNotification,
  DraftConcludedNotification,
]);
export type DraftNotification = InferOutput<typeof DraftNotification>;

export const UserNotification = BaseUserNotification;
export type UserNotification = InferOutput<typeof UserNotification>;

export const Notification = variant('target', [DraftNotification, UserNotification]);
export type Notification = InferOutput<typeof Notification>;
