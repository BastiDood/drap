import { type InferOutput, array, date, object } from 'valibot';
import { Draft } from './draft';
import { Lab } from './lab';
import { User } from './user';

export const StudentRank = object({
  draft_id: Draft.entries.draft_id,
  created_at: date(),
  labs: array(Lab.entries.lab_id),
  email: User.entries.email,
});

export type StudentRank = InferOutput<typeof StudentRank>;
