import { type InferOutput, bigint, date, minValue, number, object, pipe, safeInteger } from 'valibot';

export const Draft = object({
    draft_id: bigint(),
    curr_round: pipe(number(), safeInteger(), minValue(0)),
    max_rounds: pipe(number(), safeInteger(), minValue(0)),
    created_at: date(),
});

export type Draft = InferOutput<typeof Draft>;
