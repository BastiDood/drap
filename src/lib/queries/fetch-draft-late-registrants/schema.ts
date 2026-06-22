import * as v from 'valibot';

export const LateRegistrants = v.array(
  v.object({
    id: v.string(),
    submittedAt: v.date(),
    email: v.string(),
    givenName: v.string(),
    familyName: v.string(),
    avatarUrl: v.string(),
    studentNumber: v.nullable(v.bigint()),
    labId: v.nullable(v.string()),
    labs: v.array(v.string()),
  }),
);
export type LateRegistrants = v.InferOutput<typeof LateRegistrants>;
