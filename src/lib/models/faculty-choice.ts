import { type InferOutput, bigint, date, minValue, number, object, pipe, safeInteger } from 'valibot';
import { Lab } from '$lib/models/lab';
import { User } from '$lib/models/user';

export const FacultyChoice = object({
    choice_id: bigint(),
    created_at: date(),
    round: pipe(number(), safeInteger(), minValue(0)),
    faculty_id: User,
    lab_id: Lab.entries.lab_id,
});

export type FacultyChoice = InferOutput<typeof FacultyChoice>;
