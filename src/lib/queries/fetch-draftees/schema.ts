import * as v from 'valibot';

export const Draftees = v.array(
  v.object({
    id: v.string(),
    email: v.string(),
    givenName: v.string(),
    familyName: v.string(),
    avatarUrl: v.string(),
    studentNumber: v.nullable(v.bigint()),
    labId: v.nullable(v.string()),
    labs: v.array(v.string()),
  }),
);
export type Draftees = v.InferOutput<typeof Draftees>;
