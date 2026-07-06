import * as v from 'valibot';

export const DraftInterventionsAggregate = v.object({
  statCards: v.object({
    poolSize: v.number(),
    totalLotteryQuota: v.number(),
    delta: v.number(),
  }),
  dumbbellRows: v.array(
    v.object({
      labId: v.string(),
      labName: v.string(),
      naturalLeftover: v.number(),
      lotteryQuota: v.number(),
      gap: v.number(),
    }),
  ),
});
export type DraftInterventionsAggregate = v.InferOutput<typeof DraftInterventionsAggregate>;
