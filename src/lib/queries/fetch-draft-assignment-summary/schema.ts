import * as v from 'valibot';

const DraftAssignmentSummarySeries = v.object({
  capacity: v.number(),
  assignedByPhase: v.array(v.number()),
  assignedMax: v.number(),
});

export const DraftAssignmentSummary = v.object({
  metrics: v.object({
    participatingLabCount: v.number(),
    interventionDraftedCount: v.number(),
    lotteryDraftedCount: v.number(),
  }),
  chart: v.object({
    phases: v.array(
      v.object({
        key: v.string(),
        axisLabel: v.string(),
        tooltipLabel: v.string(),
      }),
    ),
    allLabs: DraftAssignmentSummarySeries,
    labs: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        capacity: v.number(),
        assignedByPhase: v.array(v.number()),
        assignedMax: v.number(),
      }),
    ),
  }),
});
export type DraftAssignmentSummary = v.InferOutput<typeof DraftAssignmentSummary>;
