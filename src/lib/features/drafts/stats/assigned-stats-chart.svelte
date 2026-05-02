<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { format } from 'd3-format';
  import { LineChart } from 'layerchart/svg';
  import type { MotionOptions } from 'layerchart/utils/motion.svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { scalePoint } from 'd3-scale';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import type { DraftStatsMetricChartView } from '$lib/features/drafts/types';

  interface Props {
    chart: DraftStatsMetricChartView;
  }

  const { chart }: Props = $props();

  const { chartMotion, axisMotion } = $derived<{
    chartMotion: MotionOptions;
    axisMotion: MotionOptions;
  }>(
    prefersReducedMotion.current
      ? { chartMotion: 'none', axisMotion: 'none' }
      : {
          chartMotion: { type: 'tween', duration: 280, easing: cubicOut },
          axisMotion: { type: 'tween', duration: 220, easing: cubicOut },
        },
  );

  const axisPercentFormat = format('.0%');
  const tooltipPercentFormat = format('.1~%');
  const yearFormat = format('d');
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header>
    <div class="space-y-1.5">
      <Card.Title>Yearly Assigned Student Share per Lab</Card.Title>
      <Card.Description>
        Share of assigned students by lab for each draft year. Use the legend to focus on specific
        labs. Missing years terminate each lab&apos;s line.
      </Card.Description>
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    <Chart.Container config={chart.config} class="max-h-60 w-full">
      <LineChart
        data={chart.data}
        x="year"
        xScale={scalePoint().padding(0)}
        padding={{ top: 8, right: 10, bottom: 50, left: 40 }}
        series={chart.series}
        legend={true}
        grid
        points={{ r: 4, motion: chartMotion }}
        yDomain={[0, chart.maxValue]}
        yNice={4}
        props={{
          spline: {
            strokeWidth: 3,
            motion: chartMotion,
          },
          xAxis: {
            grid: false,
            format: yearFormat,
            motion: axisMotion,
            tickLabelProps: { dy: 8 },
          },
          yAxis: {
            ticks: 4,
            format: axisPercentFormat,
            motion: axisMotion,
            tickLabelProps: { dx: -8 },
          },
        }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip
            indicator="dot"
            valueFormatter={value => tooltipPercentFormat(Number(value))}
          />
        {/snippet}
      </LineChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
