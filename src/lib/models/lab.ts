import { type InferOutput, number, object, pipe, safeInteger, string } from 'valibot';

export const Lab = object({
  lab_id: string(),
  lab_name: string(),
  quota: pipe(number(), safeInteger()),
});

export type Lab = InferOutput<typeof Lab>;
