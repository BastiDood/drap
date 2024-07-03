import { type InferOutput, bigint, date, number, object, pipe, safeInteger } from 'valibot';
import { User } from './user';

export const FacultyChoice = object({
    choice_id: bigint(),
    created_at: date(),
    round: pipe(number(), safeInteger()),
    faculty_id: User,
    lab_id: pipe(number(), safeInteger()),
});

export type FacultyChoice = InferOutput<typeof FacultyChoice>;
