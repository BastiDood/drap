<script lang="ts">
  import { Area, AreaChart, LinearGradient } from 'layerchart/svg';
  import { cubicOut } from 'svelte/easing';
  import { format } from 'd3-format';
  import { max } from 'd3-array';
  import type { MotionOptions } from 'layerchart/utils/motion.svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { startOfDay } from 'date-fns';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import { assert } from '$lib/assert';
  import { Badge } from '$lib/components/ui/badge';

  interface TimelineData {
    date: Date;
    label: string;
    count: number;
  }

  interface Props {
    draftCreatedAt: Date;
    registrationClosedAt: Date;
    startedAt: Date | null;
    requestedAt: Date;
    timelineData: TimelineData[];
  }

  const { draftCreatedAt, registrationClosedAt, startedAt, requestedAt, timelineData }: Props =
    $props();

  const integerFormat = format('d');
  const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  function formatDayLabel(value: Date) {
    return dayFormat.format(value);
  }

  const chartStart = $derived(startOfDay(draftCreatedAt));
  const chartEnd = $derived(timelineData.at(-1)?.date ?? startOfDay(startedAt ?? requestedAt));
  const registrationClosedDay = $derived(startOfDay(registrationClosedAt));

  const yMax = $derived.by(() => {
    const value = max(timelineData, ({ count }) => count);
    return typeof value === 'undefined' || value === 0 ? 1 : value;
  });

  const annotations = $derived.by(() => {
    const closedAt = registrationClosedDay.getTime();
    if (closedAt < chartStart.getTime() || closedAt > chartEnd.getTime()) return [];
    return [
      {
        type: 'line' as const,
        x: registrationClosedDay,
        label: 'Registration Closed',
        labelPlacement: 'top-left' as const,
        props: {
          line: {
            stroke: '#ef4444',
            strokeDasharray: '4,4',
            strokeWidth: 1,
          },
          label: {
            fill: '#ef4444',
          },
        },
      },
    ];
  });

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
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header class="gap-5">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-1.5 lg:flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <Card.Title>Registrants per day</Card.Title>
          <Badge variant="default">Draft Creation to Start</Badge>
        </div>
        <Card.Description>Shows how many students registered each day</Card.Description>
      </div>
      <div class="text-sm text-muted-foreground">
        {#if startedAt === null}
          Current: {requestedAt.toLocaleDateString()}
        {:else}
          Draft Started: {startedAt.toLocaleDateString()}
        {/if}
      </div>
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    <Chart.Container
      id="registrants-chart"
      config={{
        count: {
          label: 'Registrants',
          color: 'var(--color-primary)',
        },
      }}
      class="h-[500px] w-full"
    >
      <AreaChart
        data={timelineData}
        x="date"
        y="count"
        {annotations}
        series={[
          {
            key: 'count',
            label: 'Registrants',
            color: 'var(--color-primary)',
          },
        ]}
        points
        yDomain={[0, yMax]}
        yNice={4}
        props={{
          area: {
            fillOpacity: 0.22,
            motion: chartMotion,
            line: { strokeWidth: 3, motion: chartMotion },
          },
          points: { r: 5.5, motion: chartMotion },
          xAxis: {
            format: value => (value instanceof Date ? formatDayLabel(value) : `${value}`),
            motion: axisMotion,
            tickLabelProps: { dy: 8 },
          },
          yAxis: {
            ticks: 4,
            format: value => integerFormat(value),
            motion: axisMotion,
            tickLabelProps: { dx: -8 },
          },
        }}
      >
        {#snippet marks()}
          <LinearGradient class="from-primary/50 to-primary/1" vertical>
            {#snippet children({ gradient })}
              <Area line={{ class: 'stroke-primary' }} fill={gradient} />
            {/snippet}
          </LinearGradient>
        {/snippet}
        {#snippet tooltip()}
          <Chart.Tooltip
            indicator="dot"
            labelAccessor={d => {
              assert(typeof d === 'object' && d !== null && 'date' in d);
              assert(d.date instanceof Date, 'expected date');
              assert('label' in d && typeof d.label === 'string', 'expected label');
              return d.label;
            }}
          />
        {/snippet}
      </AreaChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
