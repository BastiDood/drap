import { type InferOutput, array, bigint, isoTimestamp, number, object, pipe, string } from 'valibot';

export const StudentRank = object({
    draft_id: bigint(),
    created_at: pipe(string(), isoTimestamp()),
    chosen_by: bigint(),
    labs: array(number()),
    user_id: string(),
});

export type StudentRank = InferOutput<typeof StudentRank>