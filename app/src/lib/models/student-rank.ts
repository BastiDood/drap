import { type InferOutput, array, date, object } from 'valibot';
import { Draft } from '$lib/models/draft';
import { Lab } from '$lib/models/lab';
import { User } from '$lib/models/user';

export const StudentRank = object({
    draft_id: Draft.entries.draft_id,
    created_at: date(),
    labs: array(Lab.entries.lab_id),
    email: User.entries.email,
});

export type StudentRank = InferOutput<typeof StudentRank>;
