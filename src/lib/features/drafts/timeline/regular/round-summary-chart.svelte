<script lang="ts">
  import { BarChart } from 'layerchart/svg';
  import { cubicOut } from 'svelte/easing';
  import { format } from 'd3-format';
  import { prefersReducedMotion } from 'svelte/motion';

  import * as Chart from '$lib/components/ui/chart';
  import { assert } from '$lib/assert';
  import { CHART_COLORS } from '$lib/constants';
  import type { DraftAssignmentSummary } from '$lib/features/drafts/types';

  interface Props {
    chart: DraftAssignmentSummary['chart'];
    displayedRounds: number;
  }

  const { chart, displayedRounds }: Props = $props();

  const chartMax = $derived(
    Math.max(...chart.allLabs.assignedByPhase.slice(0, displayedRounds), 1),
  );

  function chartColor(i: number) {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    assert(typeof color !== 'undefined', 'chart color index out of bounds');
    return color;
  }

  const chartConfig = $derived(
    chart.labs.reduce<Record<string, { label: string; color: string }>>((config, lab, index) => {
      config[lab.id] = {
        label: lab.id.toUpperCase(),
        color: chartColor(index),
      };
      return config;
    }, {}),
  );

  const chartSeries = $derived(
    chart.labs.map((lab, index) => ({
      key: lab.id,
      label: lab.id.toUpperCase(),
      color: chartColor(index),
    })),
  );

  const chartData = $derived(
    Array.from({ length: displayedRounds }, (_, roundIndex) => ({
      round: `Round ${roundIndex + 1}`,
      ...chart.labs.reduce<Record<string, number>>((roundData, lab) => {
        const assigned = lab.assignedByPhase[roundIndex] ?? 0;
        // Keep each round payload sparse so the shared band tooltip only renders visible stacks.
        if (assigned > 0) roundData[lab.id] = assigned;
        return roundData;
      }, {}),
    })),
  );

  const integerFormat = format('d');

  const axisMotion = $derived(
    prefersReducedMotion.current
      ? 'none'
      : ({
          type: 'tween',
          duration: 220,
          easing: cubicOut,
        } as const),
  );
</script>

{#if chartData.length === 0}
  <p class="text-sm text-muted-foreground">No regular-round data is available yet.</p>
{:else}
  <Chart.Container id="regular-round-summary-chart" config={chartConfig} class="max-h-96 w-full">
    <BarChart
      data={chartData}
      x="round"
      series={chartSeries}
      seriesLayout="stack"
      legend
      grid
      groupPadding={0.15}
      bandPadding={0.25}
      yDomain={[0, chartMax]}
      yNice={4}
      props={{
        xAxis: {
          grid: false,
          tickLabelProps: { dy: 8 },
          motion: axisMotion,
        },
        yAxis: {
          ticks: 4,
          format: value => integerFormat(value),
          motion: axisMotion,
          tickLabelProps: { dx: -8 },
        },
      }}
    >
      {#snippet tooltip()}
        <Chart.Tooltip
          indicator="dot"
          labelAccessor={d => {
            assert(typeof d === 'object' && d !== null && 'round' in d);
            return d.round;
          }}
          valueFormatter={value => integerFormat(Number(value))}
        />
      {/snippet}
    </BarChart>
  </Chart.Container>
{/if}
