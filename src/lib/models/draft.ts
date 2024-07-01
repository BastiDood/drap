import { type InferOutput, bigint, isoTimestamp, number, object, pipe, string } from 'valibot';

export const Draft = object({
    draft_id: bigint(),
    max_rounds: number(),
    curr_round: number(),
    created_at: pipe(string(), isoTimestamp()),
});

export type Draft = InferOutput<typeof Draft>;
