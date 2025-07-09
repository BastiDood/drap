import {
  type InferOutput,
  email,
  literal,
  nullable,
  number,
  object,
  pipe,
  string,
  variant,
} from 'valibot';

const BaseDraftNotif = object({
  target: literal('Draft'),
  draftId: number(),
  round: nullable(number()),
});

export type BaseDraftNotif = InferOutput<typeof BaseDraftNotif>;

const DraftRoundStartedNotif = object({
  ...BaseDraftNotif.entries,
  type: literal('RoundStart'),
});

const DraftRoundSubmittedNotif = object({
  ...BaseDraftNotif.entries,
  type: literal('RoundSubmit'),
  labId: string(),
  labName: string(),
});

const LotteryInterventionNotif = object({
  ...BaseDraftNotif.entries,
  type: literal('LotteryIntervention'),
  labId: string(),
  labName: string(),
  givenName: string(),
  familyName: string(),
  email: pipe(string(), email()),
});

const DraftConcludedNotif = object({
  ...BaseDraftNotif.entries,
  type: literal('Concluded'),
});

const BaseUserNotif = object({
  target: literal('User'),
  email: pipe(string(), email()),
  givenName: string(),
  familyName: string(),
  labName: string(),
  labId: string(),
});

export type BaseUserNotif = InferOutput<typeof BaseUserNotif>;

export const Notification = variant('target', [
  variant('type', [
    DraftRoundStartedNotif,
    DraftRoundSubmittedNotif,
    LotteryInterventionNotif,
    DraftConcludedNotif,
  ]),
  BaseUserNotif,
]);

export type Notification = InferOutput<typeof Notification>;

export const QueuedNotification = object({
  requestId: string(),
});

export type QueuedNotification = InferOutput<typeof QueuedNotification>;
