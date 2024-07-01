import { type InferOutput, bigint, isoTimestamp, number, object, pipe, string } from "valibot";

export const FacultyChoice = object({
    choice_id: bigint(),
    created_at: pipe(string(), isoTimestamp()),
    round: number(),
    faculty_id: string(),
    lab_id: number()
})

export type FacultyChoice = InferOutput<typeof FacultyChoice>