import { type InferOutput, bigint, intersect, literal, object, variant } from 'valibot';
import { Draft } from './draft';
import { Lab } from './lab';
import { User } from './user';

const DraftRoundStarted = object({
    ty: literal('DraftRoundStarted'),
    round: Draft.entries.curr_round,
});

const DraftRoundSubmitted = object({
    ty: literal('DraftRoundSubmitted'),
    round: Draft.entries.curr_round.wrapped,
    lab_id: Lab.entries.lab_id,
});

const LotteryIntervention = object({
    ty: literal('LotteryIntervention'),
    lab_id: Lab.entries.lab_id,
    email: User.entries.email,
});

const DraftConcluded = object({ ty: literal('DraftConcluded') });

export const DraftNotification = intersect([
    object({ notif_id: bigint(), draft_id: bigint() }),
    variant('ty', [DraftRoundStarted, DraftRoundSubmitted, LotteryIntervention, DraftConcluded]),
]);

export const UserNotification = object({
    notif_id: bigint(),
    lab_id: Lab.entries.lab_id,
    email: User.entries.email,
});

export type DraftRoundStarted = InferOutput<typeof DraftRoundStarted>;
export type DraftRoundSubmitted = InferOutput<typeof DraftRoundSubmitted>;
export type LotteryIntervention = InferOutput<typeof LotteryIntervention>;
export type DraftConcluded = InferOutput<typeof DraftConcluded>;

export type DraftNotification = InferOutput<typeof DraftNotification>;
export type UserNotification = InferOutput<typeof UserNotification>;
