import { type InferOutput, bigint, date, number, object, string } from 'valibot';

export const FacultyChoice = object({
    choice_id: bigint(),
    created_at: date(),
    round: number(),
    faculty_id: string(),
    lab_id: number(),
});

export type FacultyChoice = InferOutput<typeof FacultyChoice>;
