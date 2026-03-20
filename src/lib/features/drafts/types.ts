import type { schema } from '$lib/server/database/drizzle';

export interface Lab extends Pick<schema.Lab, 'id' | 'name'> {
  quota: number;
}

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
  /** Derived from the timestamp of the database for best consistency */
  isRegistrationClosed: boolean;
  /** Computed from `activePeriod` range lower bound */
  activePeriodStart: Date;
  /** Computed from `activePeriod` range upper bound */
  activePeriodEnd: Date | null;
}

export interface DraftLabQuotaSnapshot {
  labId: schema.Lab['id'];
  labName: schema.Lab['name'];
  initialQuota: number;
  lotteryQuota: number;
  finalizedQuota: number;
}

export interface DraftAssignmentRecord extends Pick<
  schema.User,
  'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
> {
  round: schema.FacultyChoiceUser['round'];
  labId: schema.Lab['id'];
  labName: schema.Lab['name'];
  assignedAt: schema.FacultyChoice['createdAt'] | null;
}

export interface DraftFinalizedBreakdown {
  quota: {
    initialQuota: number;
    lotteryInterventions: number;
    finalizedQuota: number;
  };
  snapshots: DraftLabQuotaSnapshot[];
  sections: {
    regularDrafted: DraftAssignmentRecord[];
    interventionDrafted: DraftAssignmentRecord[];
    lotteryDrafted: DraftAssignmentRecord[];
  };
}

export interface DraftRegistrationAllowlistEntry extends Pick<
  schema.DraftRegistrationAllowlist,
  'draftId' | 'studentUserId' | 'createdAt' | 'adminUserId'
> {
  studentEmail: string;
  adminGivenName: string;
  adminFamilyName: string;
  adminEmail: string;
  submittedAt: Date | null;
}
