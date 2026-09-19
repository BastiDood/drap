import { describe, expect, test } from 'vitest';

import {
  getDraftRoundsChartMax,
  getDraftRoundsChartMetricLabel,
  getDraftRoundsChartPoints,
  getDraftRoundsChartTitle,
} from './data';

const phases = [
  { key: 'round-1', axisLabel: 'R1', tooltipLabel: 'Round 1' },
  { key: 'round-2', axisLabel: 'R2', tooltipLabel: 'Round 2' },
  { key: 'round-3', axisLabel: 'R3', tooltipLabel: 'Round 3' },
  { key: 'interventions', axisLabel: 'Interventions', tooltipLabel: 'Interventions' },
  { key: 'lottery', axisLabel: 'Lottery', tooltipLabel: 'Lottery' },
];

const allLabs = { capacity: 8, assignedByPhase: [2, 1, 1, 1, 3], assignedMax: 3 };

describe('draft rounds chart data', () => {
  test('calculates remaining capacity by cumulative assignments', () => {
    expect(
      getDraftRoundsChartPoints({
        phases,
        selectedSeries: allLabs,
        cumulativeAssigned: [2, 3, 4, 5, 8],
        chartMode: 'remaining',
      }).map(point => point.remaining),
    ).toEqual([6, 5, 4, 3, 0]);
  });

  test('uses the active series mode as the plotted value', () => {
    expect(
      getDraftRoundsChartPoints({
        phases,
        selectedSeries: allLabs,
        cumulativeAssigned: [2, 3, 4, 5, 8],
        chartMode: 'assigned',
      }).map(point => point.value),
    ).toEqual([2, 1, 1, 1, 3]);
    expect(
      getDraftRoundsChartPoints({
        phases,
        selectedSeries: allLabs,
        cumulativeAssigned: [2, 3, 4, 5, 8],
        chartMode: 'remaining',
      }).map(point => point.value),
    ).toEqual([6, 5, 4, 3, 0]);
  });

  test('preserves zero capacity and missing phase values', () => {
    const selectedSeries = { capacity: 0, assignedByPhase: [], assignedMax: 0 };

    expect(getDraftRoundsChartMax(selectedSeries, 'assigned')).toBe(1);
    expect(getDraftRoundsChartMax(selectedSeries, 'remaining')).toBe(1);
    expect(
      getDraftRoundsChartPoints({
        phases,
        selectedSeries,
        cumulativeAssigned: [],
        chartMode: 'assigned',
      }).map(point => point.assigned),
    ).toEqual([0, 0, 0, 0, 0]);
  });

  test('clamps a negative remaining capacity to zero', () => {
    const selectedSeries = { capacity: 2, assignedByPhase: [3], assignedMax: 3 };

    expect(
      getDraftRoundsChartPoints({
        phases,
        selectedSeries,
        cumulativeAssigned: [3],
        chartMode: 'remaining',
      })[0],
    ).toMatchObject({ remaining: 0, value: 0 });
  });

  test('models titles and metric labels for the selected view', () => {
    expect(getDraftRoundsChartTitle('assigned', '')).toBe('Students Assigned');
    expect(getDraftRoundsChartMetricLabel('assigned', '')).toBe('Assigned');
    expect(getDraftRoundsChartTitle('remaining', '')).toBe('Students Not Yet Assigned');
    expect(getDraftRoundsChartMetricLabel('remaining', '')).toBe('Not Yet Assigned');
    expect(getDraftRoundsChartTitle('remaining', 'csl')).toBe('Labs Remaining Quota');
    expect(getDraftRoundsChartMetricLabel('remaining', 'csl')).toBe('Remaining Quota');
  });
});
