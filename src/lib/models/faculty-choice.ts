import { type InferOutput, bigint, date, number, object, pipe, safeInteger, string } from 'valibot';
import { Lab } from './lab';
import { User } from './user';

export const FacultyChoice = object({
    choice_id: bigint(),
    created_at: date(),
    round: pipe(number(), safeInteger()),
    faculty_id: User,
    lab_id: Lab.entries.lab_id,
});

export type FacultyChoice = InferOutput<typeof FacultyChoice>;
