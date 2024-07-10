import { type InferOutput, bigint, date, minValue, number, object, pipe, safeInteger } from 'valibot';
import { Draft } from '$lib/models/draft';
import { Lab } from '$lib/models/lab';
import { User } from '$lib/models/user';

export const FacultyChoice = object({
    draft_id: Draft.entries.draft_id,
    created_at: date(),
    round: pipe(number(), safeInteger(), minValue(0)),
    lab_id: Lab.entries.lab_id,
    faculty_email: User.entries.email,
});

export type FacultyChoice = InferOutput<typeof FacultyChoice>;

export const FacultyChoiceEmail = object({
    choice_email_id: bigint(),
    draft_id: FacultyChoice.entries.draft_id,
    round: FacultyChoice.entries.round,
    faculty_email: FacultyChoice.entries.faculty_email,
    student_email: User.entries.email,
});

export type FacultyChoiceEmail = InferOutput<typeof FacultyChoiceEmail>;
