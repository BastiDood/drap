import { describe, expect, test } from 'vitest';

import {
  buildDraftAssignmentSummary,
  buildDraftSummaryChartData,
  buildLotteryAggregate,
  buildPreferenceAlignment,
} from './assignment-summary';

describe('buildDraftAssignmentSummary', () => {
  test('builds zero-filled phase series and aggregate metrics from grouped assignment rows', () => {
    const summary = buildDraftAssignmentSummary(
      [
        { labId: 'lab-1', round: 1, count: 2 },
        { labId: 'lab-2', round: 2, count: 1 },
        { labId: 'lab-1', round: 4, count: 1 },
        { labId: 'lab-2', round: null, count: 1 },
      ],
      [
        { id: 'lab-1', name: 'Lab One', quota: 3 },
        { id: 'lab-2', name: 'Lab Two', quota: 2 },
      ],
      3,
      5,
    );

    expect(summary.metrics).toEqual({
      participatingLabCount: 2,
      interventionDraftedCount: 1,
      lotteryDraftedCount: 1,
    });
    expect(summary.chart.phases).toEqual([
      { key: 'round-1', axisLabel: 'R1', tooltipLabel: 'Round 1' },
      { key: 'round-2', axisLabel: 'R2', tooltipLabel: 'Round 2' },
      { key: 'round-3', axisLabel: 'R3', tooltipLabel: 'Round 3' },
      { key: 'interventions', axisLabel: 'Interventions', tooltipLabel: 'Interventions' },
      { key: 'lottery', axisLabel: 'Lottery', tooltipLabel: 'Lottery' },
    ]);
    expect(summary.chart.allLabs).toEqual({
      capacity: 5,
      assignedByPhase: [2, 1, 0, 1, 1],
      assignedMax: 2,
    });
    expect(summary.chart.labs).toEqual([
      {
        id: 'lab-1',
        name: 'Lab One',
        capacity: 3,
        assignedByPhase: [2, 0, 0, 1, 0],
        assignedMax: 2,
      },
      {
        id: 'lab-2',
        name: 'Lab Two',
        capacity: 2,
        assignedByPhase: [0, 1, 0, 0, 1],
        assignedMax: 1,
      },
    ]);
  });

  test('returns zero-filled series when no assignments exist yet', () => {
    const summary = buildDraftAssignmentSummary(
      [],
      [{ id: 'lab-1', name: 'Lab One', quota: 4 }],
      2,
      4,
    );

    expect(summary.metrics).toEqual({
      participatingLabCount: 1,
      interventionDraftedCount: 0,
      lotteryDraftedCount: 0,
    });
    expect(summary.chart.allLabs).toEqual({
      capacity: 4,
      assignedByPhase: [0, 0, 0, 0],
      assignedMax: 0,
    });
    expect(summary.chart.labs).toEqual([
      {
        id: 'lab-1',
        name: 'Lab One',
        capacity: 4,
        assignedByPhase: [0, 0, 0, 0],
        assignedMax: 0,
      },
    ]);
  });
});

describe('buildPreferenceAlignment', () => {
  test('creates individual slices for each rank sorted ascending', () => {
    const result = buildPreferenceAlignment({
      rows: [
        { preferenceRank: 3, count: 2 },
        { preferenceRank: 1, count: 10 },
        { preferenceRank: 5, count: 1 },
        { preferenceRank: 2, count: 4 },
      ],
      bordaScore: 0.75,
    });

    expect(result.slices).toEqual([
      { label: '1st Choice', count: 10 },
      { label: '2nd Choice', count: 4 },
      { label: '3rd Choice', count: 2 },
      { label: '5th Choice', count: 1 },
    ]);
  });

  test('appends "Not Preferred" last for unranked assignments', () => {
    const result = buildPreferenceAlignment({
      rows: [
        { preferenceRank: 1, count: 5 },
        { preferenceRank: null, count: 3 },
        { preferenceRank: 2, count: 2 },
      ],
      bordaScore: 0.7,
    });

    expect(result.slices).toEqual([
      { label: '1st Choice', count: 5 },
      { label: '2nd Choice', count: 2 },
      { label: 'Not Preferred', count: 3 },
    ]);
  });

  test('omits "Not Preferred" when all students ranked their assigned lab', () => {
    const result = buildPreferenceAlignment({
      rows: [
        { preferenceRank: 1, count: 4 },
        { preferenceRank: 2, count: 1 },
      ],
      bordaScore: 0.8,
    });

    expect(result.slices.map(s => s.label)).not.toContain('Not Preferred');
  });

  test('uses the database-computed Borda score', () => {
    const result = buildPreferenceAlignment({
      rows: [{ preferenceRank: 1, count: 2 }],
      bordaScore: 0.625,
    });

    expect(result.bordaScore).toBeCloseTo(0.625);
  });

  test('returns zero Borda score when no rows exist', () => {
    const result = buildPreferenceAlignment({ rows: [], bordaScore: 0 });
    expect(result.bordaScore).toBe(0);
    expect(result.slices).toEqual([]);
  });
});

describe('buildDraftSummaryChartData', () => {
  test('assembles database-computed summary chart data', () => {
    const summary = buildDraftSummaryChartData(
      [
        { labId: 'lab-1', labName: 'Lab One', count: 2 },
        { labId: null, labName: 'Unassigned', count: 1 },
      ],
      {
        rows: [{ preferenceRank: 1, count: 2 }],
        bordaScore: 0.5,
      },
      [
        {
          labId: 'lab-1',
          labName: 'Lab One',
          supplyShare: 0.5,
          demandShare: 0.75,
          actualShare: 1,
        },
      ],
    );

    expect(summary.labDistribution).toEqual([
      { labId: 'lab-1', labName: 'Lab One', count: 2 },
      { labId: null, labName: 'Unassigned', count: 1 },
    ]);
    expect(summary.preferenceAlignment).toEqual({
      slices: [{ label: '1st Choice', count: 2 }],
      bordaScore: 0.5,
    });
    expect(summary.supplyVsDemand).toEqual([
      {
        labId: 'lab-1',
        labName: 'Lab One',
        supplyShare: 0.5,
        demandShare: 0.75,
        actualShare: 1,
      },
    ]);
  });
});

describe('buildLotteryAggregate', () => {
  test('passes through database-computed stat cards', () => {
    const rows = [
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 1n, count: 2 },
      { labId: 'lab-b', labName: 'Beta Lab', preferenceRank: 2n, count: 1 },
      { labId: 'lab-c', labName: 'Gamma Lab', preferenceRank: null, count: 1 },
    ];
    const result = buildLotteryAggregate(rows, {
      poolSize: 4,
      topChoice: 2,
      rankedLab: 3,
      unranked: 1,
      medianRankHonored: 1,
    });

    expect(result.statCards.poolSize).toBe(4);
    expect(result.statCards.topChoice).toBe(2);
    expect(result.statCards.rankedLab).toBe(3);
    expect(result.statCards.unranked).toBe(1);
    expect(result.statCards.medianRankHonored).toBe(1);
  });

  test('returns empty outcomeStacks and zero stats for empty rows', () => {
    const result = buildLotteryAggregate([], {
      poolSize: 0,
      topChoice: 0,
      rankedLab: 0,
      unranked: 0,
      medianRankHonored: null,
    });

    expect(result.statCards.poolSize).toBe(0);
    expect(result.statCards.topChoice).toBe(0);
    expect(result.statCards.unranked).toBe(0);
    expect(result.statCards.medianRankHonored).toBeNull();
    expect(result.outcomeStacks).toHaveLength(0);
  });

  test('builds outcome stacks grouped by lab with correct label ordering', () => {
    const rows = [
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 2n, count: 1 },
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: null, count: 1 },
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 1n, count: 2 },
    ];
    const result = buildLotteryAggregate(rows, {
      poolSize: 4,
      topChoice: 2,
      rankedLab: 3,
      unranked: 1,
      medianRankHonored: 1,
    });

    const alphaStack = /** @type {NonNullable<typeof result.outcomeStacks[0]>} */ (
      result.outcomeStacks.find(s => s.labId === 'lab-a')
    );
    expect(alphaStack).toBeDefined();
    expect(alphaStack.total).toBe(4);

    const labels = alphaStack.buckets.map(b => b.label);
    expect(labels.indexOf('1st Choice')).toBeLessThan(labels.indexOf('2nd Choice'));
    expect(labels[labels.length - 1]).toBe('Not Preferred');
  });

  test('excludes labs with zero lottery placements from outcomeStacks', () => {
    const rows = [{ labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 1n, count: 2 }];
    const result = buildLotteryAggregate(rows, {
      poolSize: 2,
      topChoice: 2,
      rankedLab: 2,
      unranked: 0,
      medianRankHonored: 1,
    });

    expect(result.outcomeStacks).toHaveLength(1);
    expect(result.outcomeStacks[0]?.labId).toBe('lab-a');
  });

  test('sorts outcome stacks alphabetically by lab name', () => {
    const rows = [
      { labId: 'lab-c', labName: 'Gamma Lab', preferenceRank: 1n, count: 1 },
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 1n, count: 1 },
    ];
    const result = buildLotteryAggregate(rows, {
      poolSize: 2,
      topChoice: 2,
      rankedLab: 2,
      unranked: 0,
      medianRankHonored: 1,
    });

    expect(result.outcomeStacks[0]?.labName).toBe('Alpha Lab');
    expect(result.outcomeStacks[1]?.labName).toBe('Gamma Lab');
  });

  test('populates the rank field on each bucket (1-based for ranked, null for unranked)', () => {
    const rows = [
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 1n, count: 2 },
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: null, count: 1 },
    ];
    const result = buildLotteryAggregate(rows, {
      poolSize: 3,
      topChoice: 2,
      rankedLab: 2,
      unranked: 1,
      medianRankHonored: 1,
    });

    expect(result.outcomeStacks.find(s => s.labId === 'lab-a')?.buckets).toEqual([
      { rank: 1, label: '1st Choice', count: 2 },
      { rank: null, label: 'Not Preferred', count: 1 },
    ]);
  });

  test('sorts buckets numerically by rank with null last', () => {
    const rows = [
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 3n, count: 2 },
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: 1n, count: 5 },
      { labId: 'lab-a', labName: 'Alpha Lab', preferenceRank: null, count: 1 },
    ];
    const result = buildLotteryAggregate(rows, {
      poolSize: 8,
      topChoice: 5,
      rankedLab: 7,
      unranked: 1,
      medianRankHonored: 1,
    });

    expect(result.outcomeStacks.find(s => s.labId === 'lab-a')?.buckets).toEqual([
      { rank: 1, label: '1st Choice', count: 5 },
      { rank: 3, label: '3rd Choice', count: 2 },
      { rank: null, label: 'Not Preferred', count: 1 },
    ]);
  });
});
