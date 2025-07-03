import { type InferOutput, email, literal, number, object, pipe, string, variant } from "valibot";

const BaseDraftNotif = object({
    target: literal('Draft'),
    draftId: number()
})

const DraftRoundStartedNotif = object({
    ...BaseDraftNotif.entries,
    type: literal('RoundStart')
})

const DraftRoundSubmittedNotif = object({
    ...BaseDraftNotif.entries,
    type: literal('RoundSubmit')
})

const LotteryInterventionNotif = object({
    ...BaseDraftNotif.entries,
    type: literal('LotteryIntervention')
})

const DraftConcludedNotif = object({
    ...BaseDraftNotif.entries,
    type: literal('Concluded')
})

const BaseUserNotif = object({
    target: literal('User'),
    email: pipe(string(),email()),
    given_name: string(),
    family_name: string(),
    lab_name: string()
})

export const Notification = variant(
    'target',
    [
        variant('type', [DraftRoundStartedNotif, DraftRoundSubmittedNotif, LotteryInterventionNotif, DraftConcludedNotif]),
        BaseUserNotif
    ]
)

export type Notification = InferOutput<typeof Notification>;