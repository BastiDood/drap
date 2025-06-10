import {
  type InferOutput,
  bigint,
  date,
  minValue,
  nullable,
  number,
  object,
  pipe,
  safeInteger,
} from 'valibot';

export const Draft = object({
  draft_id: bigint(),
  curr_round: nullable(pipe(number(), safeInteger(), minValue(0))),
  max_rounds: pipe(number(), safeInteger(), minValue(0)),
  active_period_start: date(),
  active_period_end: nullable(date()),
});

export type Draft = InferOutput<typeof Draft>;
