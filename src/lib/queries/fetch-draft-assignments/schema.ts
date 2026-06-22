import * as v from 'valibot';

export const DraftAssignmentRecords = v.array(
  v.object({
    id: v.string(),
    createdAt: v.date(),
    labId: v.string(),
    round: v.nullable(v.number()),
    assignedAt: v.nullable(v.date()),
    email: v.string(),
    givenName: v.string(),
    familyName: v.string(),
    avatarUrl: v.string(),
    studentNumber: v.nullable(v.bigint()),
    labName: v.string(),
  }),
);
export type DraftAssignmentRecords = v.InferOutput<typeof DraftAssignmentRecords>;
