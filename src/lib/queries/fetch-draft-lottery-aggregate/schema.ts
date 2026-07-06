import * as v from 'valibot';

export const DraftLotteryAggregate = v.object({
  statCards: v.object({
    poolSize: v.number(),
    topChoice: v.number(),
    rankedLab: v.number(),
    unranked: v.number(),
    medianRankHonored: v.nullable(v.number()),
  }),
  outcomeStacks: v.array(
    v.object({
      labId: v.string(),
      labName: v.string(),
      buckets: v.array(
        v.object({
          rank: v.nullable(v.number()),
          label: v.string(),
          count: v.number(),
        }),
      ),
      total: v.number(),
    }),
  ),
});
export type DraftLotteryAggregate = v.InferOutput<typeof DraftLotteryAggregate>;
