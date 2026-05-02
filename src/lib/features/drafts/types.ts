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
  'id' | 'currRound' | 'maxRounds' | 'registrationClosedAt' | 'startedAt'
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

export interface DraftAssignmentCountByAttribute {
  labId: string;
  round: number | null;
  count: number;
}

export interface DraftAssignmentSummaryPhase {
  key: string;
  axisLabel: string;
  tooltipLabel: string;
}

export interface DraftAssignmentSummarySeries {
  capacity: number;
  assignedByPhase: number[];
  assignedMax: number;
}

export interface DraftAssignmentSummaryLab extends DraftAssignmentSummarySeries {
  id: string;
  name: string;
}

export interface DraftAssignmentSummary {
  metrics: {
    participatingLabCount: number;
    interventionDraftedCount: number;
    lotteryDraftedCount: number;
  };
  chart: {
    phases: DraftAssignmentSummaryPhase[];
    allLabs: DraftAssignmentSummarySeries;
    labs: DraftAssignmentSummaryLab[];
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

export interface DraftLabDistributionEntry {
  labId: string | null;
  labName: string;
  count: number;
}

export interface DraftPreferenceAlignmentSlice {
  label: string;
  count: number;
}

export interface DraftPreferenceAlignment {
  slices: DraftPreferenceAlignmentSlice[];
  bordaScore: number;
}

export interface DraftPreferenceAlignmentAggregate {
  rows: DraftPreferenceAlignmentRow[];
  bordaScore: number;
}

export interface DraftSupplyDemandEntry {
  labId: string;
  labName: string;
  supplyShare: number;
  demandShare: number;
  actualShare: number;
}

export interface DraftSummaryChartData {
  labDistribution: DraftLabDistributionEntry[];
  preferenceAlignment: DraftPreferenceAlignment;
  supplyVsDemand: DraftSupplyDemandEntry[];
}

export interface DraftPreferenceAlignmentRow {
  preferenceRank: number | null;
  count: number;
}

export interface InterventionsStatCards {
  poolSize: number;
  totalLotteryQuota: number;
  delta: number;
}

export interface DumbbellRow {
  labId: string;
  labName: string;
  naturalLeftover: number;
  lotteryQuota: number;
  gap: number;
}

export interface InterventionsAggregate {
  statCards: InterventionsStatCards;
  dumbbellRows: DumbbellRow[];
}

export interface LotteryStatCards {
  poolSize: number;
  topChoice: number;
  rankedLab: number;
  unranked: number;
  medianRankHonored: number | null;
}

export interface LotteryOutcomeRow {
  labId: string;
  labName: string;
  preferenceRank: bigint | null;
  count: number;
}

export interface LotteryOutcomeBucket {
  /** Preference rank (1-based), or `null` for "Not Preferred" placements. */
  rank: number | null;
  label: string;
  count: number;
}

export interface LotteryOutcomeStack {
  labId: string;
  labName: string;
  buckets: LotteryOutcomeBucket[];
  total: number;
}

export interface LotteryAggregate {
  statCards: LotteryStatCards;
  outcomeStacks: LotteryOutcomeStack[];
}

export interface DraftStatsRecord {
  draftId: schema.Draft['id'];
  activePeriodStart: Date;
  labId: schema.Lab['id'];
  draftedStudents: number;
}

export interface DraftStatsChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface DraftStatsChartDatum extends Record<string, number | string | null> {
  year: number;
}

export interface DraftStatsMetricChartView {
  config: Record<string, { label: string; color: string }>;
  series: DraftStatsChartSeries[];
  data: DraftStatsChartDatum[];
  maxValue: number;
}
