<script lang="ts">
  import { BarChart } from 'layerchart/svg';
  import { format } from 'd3-format';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import { assert } from '$lib/assert';
  import { CHART_COLORS } from '$lib/constants';
  import type { LotteryOutcomeStack } from '$lib/features/drafts/types';

  import { keyForRank } from './lottery-outcome-chart-utils';

  interface Props {
    stacks: LotteryOutcomeStack[];
  }

  const { stacks }: Props = $props();

  // Dedupe by rank across all stacks, sort numerically (null → "Not Preferred" goes last).
  const allBucketsMeta = $derived(
    Array.from(
      new Map(stacks.flatMap(s => s.buckets.map(b => [b.rank, b.label] as const))).entries(),
    ).sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    }),
  );

  function labelColor(label: string, i: number): string {
    if (label === 'Not Preferred') return 'var(--muted-foreground)';
    const color = CHART_COLORS[i % CHART_COLORS.length];
    assert(typeof color === 'string', 'chart color index out of bounds');
    return color;
  }

  // Config and series keyed by CSS-safe identifiers (rank-1, rank-2, …, not-preferred) so that
  // chart-style.svelte emits valid --color-* custom properties. Display labels stay in the
  // `label` field, never in the key.
  const chartConfig = $derived(
    Object.fromEntries(
      allBucketsMeta.map(([rank, label], i) => [
        keyForRank(rank),
        { label, color: labelColor(label, i) },
      ]),
    ),
  );

  const chartSeries = $derived(
    allBucketsMeta
      .map(([rank, label], i) => ({
        key: keyForRank(rank),
        label,
        color: labelColor(label, i),
      }))
      .reverse(),
  );

  const chartData = $derived(
    stacks.map(stack => {
      const row: Record<string, number | string> = { lab: stack.labId.toUpperCase() };
      const countByRank = new Map(stack.buckets.map(({ rank, count }) => [rank, count]));
      for (const [rank] of allBucketsMeta) {
        const count = countByRank.get(rank);
        if (typeof count !== 'undefined' && count > 0) row[keyForRank(rank)] = count;
      }
      return row;
    }),
  );

  const labNameById = $derived(new Map(stacks.map(s => [s.labId.toUpperCase(), s.labName])));

  const integerFormat = format('d');
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header>
    <Card.Title>Per-Lab Lottery Outcome</Card.Title>
    <Card.Description>
      Lottery-placed students by lab, broken down by preference rank quality
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Chart.Container id="lottery-outcome-chart" config={chartConfig} class="max-h-[400px] w-full">
      <BarChart
        data={chartData}
        x="lab"
        series={chartSeries}
        seriesLayout="stack"
        legend
        grid
        groupPadding={0.15}
        bandPadding={0.25}
        props={{
          xAxis: {
            grid: false,
            tickLabelProps: { dy: 8 },
          },
          yAxis: {
            ticks: 4,
            format: (value: number) => integerFormat(value),
            tickLabelProps: { dx: -8 },
          },
        }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip
            indicator="dot"
            labelAccessor={d => {
              assert(typeof d === 'object' && d !== null && 'lab' in d);
              return d.lab;
            }}
            labelFormatter={value => {
              assert(typeof value === 'string');
              return labNameById.get(value) ?? value;
            }}
            valueFormatter={value => integerFormat(Number(value))}
          />
        {/snippet}
      </BarChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
