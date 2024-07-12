import { type InferOutput, bigint, date, object } from 'valibot';
import { Draft } from '$lib/models/draft';
import { Lab } from '$lib/models/lab';
import { User } from '$lib/models/user';

export const FacultyChoice = object({
    choice_id: bigint(),
    draft_id: Draft.entries.draft_id,
    created_at: date(),
    round: Draft.entries.curr_round,
    lab_id: Lab.entries.lab_id,
    faculty_email: User.entries.email,
});

export type FacultyChoice = InferOutput<typeof FacultyChoice>;

export const FacultyChoiceEmail = object({
    choice_email_id: bigint(),
    draft_id: FacultyChoice.entries.draft_id,
    round: FacultyChoice.entries.round,
    lab_id: FacultyChoice.entries.lab_id,
    student_email: User.entries.email,
});

export type FacultyChoiceEmail = InferOutput<typeof FacultyChoiceEmail>;
