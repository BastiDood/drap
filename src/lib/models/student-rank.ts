import { type InferOutput, array, date, object, string } from 'valibot';
import { Draft } from './draft';
import { FacultyChoice } from './faculty-choice';
import { Lab } from './lab';

export const StudentRank = object({
    draft_id: Draft.entries.draft_id,
    created_at: date(),
    chosen_by: FacultyChoice.entries.choice_id,
    labs: array(Lab.entries.lab_id),
    user_id: string(),
});

export type StudentRank = InferOutput<typeof StudentRank>;
