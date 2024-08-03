import { type InferOutput, bigint, intersect, literal, number, object, pipe, safeInteger, variant } from 'valibot';
import { Lab } from './lab';
import { User } from './user';

const DraftRoundStarted = object({
    ty: literal('DraftRoundStarted'),
    round: pipe(number(), safeInteger()),
});

const DraftRoundSubmitted = object({
    ty: literal('DraftRoundSubmitted'),
    round: pipe(number(), safeInteger()),
    lab_id: Lab.entries.lab_id,
});

const LotteryIntervention = object({
    ty: literal('LotteryIntervention'),
    lab_id: Lab.entries.lab_id,
    email: User.entries.email,
});

export const DraftNotification = intersect([
    object({ notif_id: bigint(), draft_id: bigint() }),
    variant('ty', [DraftRoundStarted, DraftRoundSubmitted, LotteryIntervention]),
]);

export const UserNotification = object({
    notif_id: bigint(),
    lab_id: Lab.entries.lab_id,
    email: User.entries.email,
});

export type DraftNotification = InferOutput<typeof DraftNotification>;
export type UserNotification = InferOutput<typeof UserNotification>;
