import * as v from 'valibot';

export const DraftAllowlistEntries = v.array(
  v.object({
    draftId: v.bigint(),
    studentUserId: v.string(),
    createdAt: v.date(),
    adminUserId: v.string(),
    studentEmail: v.string(),
    adminGivenName: v.string(),
    adminFamilyName: v.string(),
    adminEmail: v.string(),
    submittedAt: v.nullable(v.date()),
  }),
);
export type DraftAllowlistEntries = v.InferOutput<typeof DraftAllowlistEntries>;
