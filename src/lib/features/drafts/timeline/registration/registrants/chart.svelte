<script lang="ts">
  import { Area, AreaChart, LinearGradient } from 'layerchart/svg';
  import { cubicOut } from 'svelte/easing';
  import { format } from 'd3-format';
  import { max } from 'd3-array';
  import type { MotionOptions } from 'layerchart/utils/motion.svelte';
  import { prefersReducedMotion } from 'svelte/motion';

  import * as Chart from '$lib/components/ui/chart';
  import { assert } from '$lib/assert';

  import {
    buildRegistrationTimelineData,
    formatDayLabel,
    getRegistrationClosedAnnotationDay,
    getRegistrationTimelineEnd,
  } from './utils';

  interface Props {
    draftCreatedAt: Date;
    registrationClosedAt: Date;
    startedAt: Date | null;
    requestedAt: Date;
    registrationTimestamps: string[];
  }

  const {
    draftCreatedAt,
    registrationClosedAt,
    startedAt,
    requestedAt,
    registrationTimestamps,
  }: Props = $props();

  const integerFormat = format('d');

  const timelineEnd = $derived(
    getRegistrationTimelineEnd(startedAt ?? requestedAt, registrationClosedAt),
  );

  const timelineData = $derived(
    buildRegistrationTimelineData({
      draftCreatedAt,
      chartEnd: timelineEnd,
      registrationTimestamps,
    }),
  );

  const registrationClosedDay = $derived(getRegistrationClosedAnnotationDay(registrationClosedAt));

  const [chartStart, chartEnd] = $derived.by(() => {
    const [first, ...rest] = timelineData;
    const start = first?.date ?? draftCreatedAt;
    const end = rest.at(-1)?.date ?? timelineEnd;
    return [start, end];
  });

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
