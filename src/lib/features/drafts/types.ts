import type { schema } from '$lib/server/database';

export type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota'>;

export interface Student extends Pick<
  schema.User,
  'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
> {
  labId: string | null;
  labs: string[];
}

export interface FacultyChoiceRecord extends Pick<
  schema.FacultyChoice,
  'draftId' | 'round' | 'labId' | 'createdAt' | 'userId'
> {
  userEmail: schema.User['email'] | null;
  studentEmail: schema.User['email'] | null;
}

export interface Draft extends Pick<
  schema.Draft,
  'id' | 'currRound' | 'maxRounds' | 'registrationClosesAt'
> {
  /** Computed from `activePeriod` range lower bound */
  activePeriodStart: Date;
  /** Computed from `activePeriod` range upper bound */
  activePeriodEnd: Date | null;
}
