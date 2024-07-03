import { type InferOutput, array, date, object } from 'valibot';
import { Draft } from '$lib/models/draft';
import { FacultyChoice } from '$lib/models/faculty-choice';
import { Lab } from '$lib/models/lab';
import { User } from '$lib/models/user';

export const StudentRank = object({
    draft_id: Draft.entries.draft_id,
    created_at: date(),
    chosen_by: FacultyChoice.entries.choice_id,
    labs: array(Lab.entries.lab_id),
    email: User.entries.email,
});

export type StudentRank = InferOutput<typeof StudentRank>;
