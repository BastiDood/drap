import type { DraftAssignmentSummary } from '$lib/features/drafts/types';

export type DraftRoundsChartMode = 'assigned' | 'remaining';

interface DraftRoundsChartPointsInput {
  phases: DraftAssignmentSummary['chart']['phases'];
  selectedSeries: DraftAssignmentSummary['chart']['allLabs'];
  cumulativeAssigned: number[];
  chartMode: DraftRoundsChartMode;
}

export function getDraftRoundsChartPoints({
  phases,
  selectedSeries,
  cumulativeAssigned,
  chartMode,
}: DraftRoundsChartPointsInput) {
  return phases.map((phase, index) => {
    const assigned = selectedSeries.assignedByPhase[index] ?? 0;
    const remaining = Math.max(selectedSeries.capacity - (cumulativeAssigned[index] ?? 0), 0);
    switch (chartMode) {
      case 'assigned':
        return { ...phase, assigned, remaining, value: assigned };
      case 'remaining':
        return { ...phase, assigned, remaining, value: remaining };
      default:
        throw new Error('Unhandled chart mode');
    }
  });
}

export function getDraftRoundsChartMax(
  selectedSeries: DraftAssignmentSummary['chart']['allLabs'],
  chartMode: DraftRoundsChartMode,
) {
  switch (chartMode) {
    case 'assigned':
      return Math.max(selectedSeries.assignedMax, 1);
    case 'remaining':
      return Math.max(selectedSeries.capacity, 1);
    default:
      throw new Error('Unhandled chart mode');
  }
}

export function getDraftRoundsChartTitle(chartMode: DraftRoundsChartMode, selectedLabId: string) {
  switch (chartMode) {
    case 'assigned':
      return 'Students Assigned';
    case 'remaining':
      if (selectedLabId === '') return 'Students Not Yet Assigned';
      return 'Labs Remaining Quota';
    default:
      throw new Error('Unhandled chart mode');
  }
}

export function getDraftRoundsChartMetricLabel(
  chartMode: DraftRoundsChartMode,
  selectedLabId: string,
) {
  switch (chartMode) {
    case 'assigned':
      return 'Assigned';
    case 'remaining':
      if (selectedLabId === '') return 'Not Yet Assigned';
      return 'Remaining Quota';
    default:
      throw new Error('Unhandled chart mode');
  }
}
