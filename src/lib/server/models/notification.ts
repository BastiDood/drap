import {
  type InferOutput,
  literal,
  nullable,
  number,
  object,
  pipe,
  string,
  ulid,
  variant,
} from 'valibot';

const BaseDraftNotification = object({
  target: literal('Draft'),
  draftId: number(),
  round: nullable(number()),
});
export type BaseDraftNotification = InferOutput<typeof BaseDraftNotification>;

function createDraftNotification(draftId: bigint, draftRound: number | null) {
  return {
    target: 'Draft',
    draftId: Number(draftId),
    round: draftRound,
  } satisfies BaseDraftNotification;
}

const DraftRoundStartedNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('RoundStart'),
});
export type DraftRoundStartedNotification = InferOutput<typeof DraftRoundStartedNotification>;

export function createDraftRoundStartedNotification(draftId: bigint, draftRound: number | null) {
  const base = createDraftNotification(draftId, draftRound);
  return { ...base, type: 'RoundStart' } satisfies DraftRoundStartedNotification;
}

const DraftRoundSubmittedNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('RoundSubmit'),
  labId: string(),
});
export type DraftRoundSubmittedNotification = InferOutput<typeof DraftRoundSubmittedNotification>;

export function createDraftRoundSubmittedNotification(
  draftId: bigint,
  draftRound: number | null,
  labId: string,
) {
  const base = createDraftNotification(draftId, draftRound);
  return {
    ...base,
    type: 'RoundSubmit',
    labId,
  } satisfies DraftRoundSubmittedNotification;
}

const DraftLotteryInterventionNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('LotteryIntervention'),
  labId: string(),
  userId: pipe(string(), ulid()),
});
export type DraftLotteryInterventionNotification = InferOutput<
  typeof DraftLotteryInterventionNotification
>;

export function createDraftLotteryInterventionNotification(
  draftId: bigint,
  labId: string,
  userId: string,
) {
  const base = createDraftNotification(draftId, null);
  return {
    ...base,
    type: 'LotteryIntervention',
    labId,
    userId,
  } satisfies DraftLotteryInterventionNotification;
}

const DraftConcludedNotification = object({
  ...BaseDraftNotification.entries,
  type: literal('Concluded'),
});
export type DraftConcludedNotification = InferOutput<typeof DraftConcludedNotification>;

export function createDraftConcludedNotification(draftId: bigint) {
  const base = createDraftNotification(draftId, null);
  return { ...base, type: 'Concluded' } satisfies DraftConcludedNotification;
}

const BaseUserNotification = object({
  draftId: number(),
  target: literal('User'),
  userId: pipe(string(), ulid()),
  labId: string(),
});
export type BaseUserNotification = InferOutput<typeof BaseUserNotification>;

export function createUserNotification(draftId: bigint, userId: string, labId: string) {
  return { draftId: Number(draftId), target: 'User', userId, labId } satisfies UserNotification;
}

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
