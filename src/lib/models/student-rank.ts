import { type InferOutput, array, bigint, date, number, object, string } from 'valibot';

export const StudentRank = object({
    draft_id: bigint(),
    created_at: date(),
    chosen_by: bigint(),
    labs: array(number()),
    user_id: string(),
});

export type StudentRank = InferOutput<typeof StudentRank>;
