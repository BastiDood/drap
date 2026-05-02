import { index, max, rollup, sum as d3sum } from 'd3-array';

import type {
  DraftAssignmentCountByAttribute,
  DraftAssignmentSummary,
  DraftLabDistributionEntry,
  DraftPreferenceAlignmentAggregate,
  DraftPreferenceAlignmentRow,
  DraftSummaryChartData,
  DraftSupplyDemandEntry,
  Lab,
  LotteryAggregate,
  LotteryOutcomeBucket,
  LotteryOutcomeRow,
  LotteryStatCards,
} from '$lib/features/drafts/types';
import { getOrdinalSuffix } from '$lib/ordinal';

function getPhaseIndex(round: number | null, maxRounds: number) {
  if (round === null) return maxRounds + 1;
  if (round > 0 && round <= maxRounds) return round - 1;
  if (round === maxRounds + 1) return maxRounds;
  throw new Error(`unexpected draft assignment round: ${round}`);
}

function buildAssignedByPhase(
  phaseCount: ReadonlyMap<number, number> | undefined,
  phaseCountTotal: number,
) {
  return Array.from({ length: phaseCountTotal }, (_, index) => phaseCount?.get(index) ?? 0);
}

function getAssignedMax(assignedByPhase: number[]) {
  return max(assignedByPhase) ?? 0;
}

export function buildDraftAssignmentSummary(
  assignmentCountsByAttribute: DraftAssignmentCountByAttribute[],
  labs: Lab[],
  maxRounds: number,
  totalStudents: number,
): DraftAssignmentSummary {
  const phaseCountTotal = maxRounds + 2;
  const phases = [
    ...Array.from({ length: maxRounds }, (_, index) => {
      const round = index + 1;
      return {
        key: `round-${round}`,
        axisLabel: `R${round}`,
        tooltipLabel: `Round ${round}`,
      };
    }),
    {
      key: 'interventions',
      axisLabel: 'Interventions',
      tooltipLabel: 'Interventions',
    },
    {
      key: 'lottery',
      axisLabel: 'Lottery',
      tooltipLabel: 'Lottery',
    },
  ];

  const labById = index(labs, ({ id }) => id);

  const totalByPhase = rollup(
    assignmentCountsByAttribute,
    values => d3sum(values, d => d.count),
    ({ round }) => getPhaseIndex(round, maxRounds),
  );

  const countByLabAndPhase = rollup(
    assignmentCountsByAttribute,
    values => d3sum(values, d => d.count),
    ({ labId }) => labId,
    ({ round }) => getPhaseIndex(round, maxRounds),
  );

  const allLabsAssignedByPhase = buildAssignedByPhase(totalByPhase, phaseCountTotal);

  const labsChart = labs.map(lab => {
    const existingLab = labById.get(lab.id);
    if (typeof existingLab === 'undefined')
      throw new Error(`draft lab is missing from the snapshot index: ${lab.id}`);
    const assignedByPhase = buildAssignedByPhase(
      countByLabAndPhase.get(existingLab.id),
      phaseCountTotal,
    );
    return {
      id: existingLab.id,
      name: existingLab.name,
      capacity: existingLab.quota,
      assignedByPhase,
      assignedMax: getAssignedMax(assignedByPhase),
    };
  });

  return {
    metrics: {
      participatingLabCount: labs.length,
      interventionDraftedCount: allLabsAssignedByPhase[maxRounds] ?? 0,
      lotteryDraftedCount: allLabsAssignedByPhase[maxRounds + 1] ?? 0,
    },
    chart: {
      phases,
      allLabs: {
        capacity: totalStudents,
        assignedByPhase: allLabsAssignedByPhase,
        assignedMax: getAssignedMax(allLabsAssignedByPhase),
      },
      labs: labsChart,
    },
  };
}

export function buildPreferenceAlignment({
  rows,
  bordaScore,
}: DraftPreferenceAlignmentAggregate): DraftSummaryChartData['preferenceAlignment'] {
  const ranked = rows
    .filter((row): row is DraftPreferenceAlignmentRow & { preferenceRank: number } => {
      return row.preferenceRank !== null && row.count > 0;
    })
    .sort((a, b) => a.preferenceRank - b.preferenceRank);

  const slices = ranked.map(({ preferenceRank: rank, count }) => ({
    label: `${rank}${getOrdinalSuffix(rank)} Choice`,
    count,
  }));

  const notPreferred = rows.find(row => row.preferenceRank === null)?.count ?? 0;
  if (notPreferred > 0) slices.push({ label: 'Not Preferred', count: notPreferred });

  return { slices, bordaScore };
}

export function buildLotteryAggregate(
  rows: LotteryOutcomeRow[],
  statCards: LotteryStatCards,
): LotteryAggregate {
  const labBuckets = rollup(
    rows,
    values =>
      rollup(
        values,
        bucketValues => d3sum(bucketValues, d => d.count),
        ({ preferenceRank }) => (preferenceRank === null ? null : Number(preferenceRank)),
      ),
    ({ labId }) => labId,
  );

  const outcomeStacks = Array.from(labBuckets.entries())
    .map(([labId, buckets]) => {
      const labName = rows.find(row => row.labId === labId)?.labName ?? labId;
      const allRankedRanks = Array.from(buckets.keys())
        .filter((rank): rank is number => rank !== null)
        .sort((a, b) => a - b);
      const total = d3sum(buckets.values());
      const ordered: LotteryOutcomeBucket[] = [];
      for (const rank of allRankedRanks) {
        const count = buckets.get(rank) ?? 0;
        if (count > 0)
          ordered.push({ rank, label: `${rank}${getOrdinalSuffix(rank)} Choice`, count });
      }
      const notPreferred = buckets.get(null) ?? 0;
      if (notPreferred > 0)
        ordered.push({ rank: null, label: 'Not Preferred', count: notPreferred });
      return { labId, labName, buckets: ordered, total };
    })
    .sort((a, b) => a.labName.localeCompare(b.labName));

  return { statCards, outcomeStacks };
}

export function buildDraftSummaryChartData(
  labDistribution: DraftLabDistributionEntry[],
  preferenceAlignment: DraftPreferenceAlignmentAggregate,
  supplyVsDemand: DraftSupplyDemandEntry[],
): DraftSummaryChartData {
  return {
    labDistribution,
    preferenceAlignment: buildPreferenceAlignment(preferenceAlignment),
    supplyVsDemand,
  };
}
