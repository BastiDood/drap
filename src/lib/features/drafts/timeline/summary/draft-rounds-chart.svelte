<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import type { DraftAssignmentRecord, Lab } from '$lib/features/drafts/types';

  interface Props {
    records: DraftAssignmentRecord[];
    maxRounds: number;
    interventionRecords?: DraftAssignmentRecord[];
    lotteryRecords?: DraftAssignmentRecord[];
    labs: Lab[];
    totalStudents: number;
  }

  const {
    records,
    maxRounds,
    interventionRecords = [],
    lotteryRecords = [],
    labs,
    totalStudents,
  }: Props = $props();

  let chartMode = $state<'assigned' | 'remaining'>('assigned');

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600;
  const height = 200;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  let selectedLabId = $state<string | null>(null);
  let hoveredPoint = $state<{
    label: string;
    count: number;
    remaining: number;
    x: number;
    y: number;
  } | null>(null);

  const filteredRecords = $derived(
    selectedLabId === null ? records : records.filter(r => r.labId === selectedLabId),
  );
  const filteredInterventionRecords = $derived(
    selectedLabId === null
      ? interventionRecords
      : interventionRecords.filter(r => r.labId === selectedLabId),
  );
  const filteredLotteryRecords = $derived(
    selectedLabId === null ? lotteryRecords : lotteryRecords.filter(r => r.labId === selectedLabId),
  );

  const selectedLabQuota = $derived(
    selectedLabId === null ? null : (labs.find(l => l.id === selectedLabId)?.quota ?? null),
  );

  const chartData = $derived(() => {
    const roundCounts: Record<number, number> = {};
    for (let i = 1; i <= maxRounds; i++) roundCounts[i] = 0;

    for (const record of filteredRecords)
      if (record.round !== null && record.round > 0)
        roundCounts[record.round] = (roundCounts[record.round] ?? 0) + 1;

    const nonZeroRounds = Object.entries(roundCounts)
      .filter(([, count]) => count > 0)
      .map(([round, count]) => ({ round: Number(round), count }))
      .sort((a, b) => a.round - b.round);

    const interventionCount = filteredInterventionRecords.length;
    const hasInterventions = interventionCount > 0;
    const hasLottery = filteredLotteryRecords.length > 0;
    const totalPoints = nonZeroRounds.length + (hasInterventions ? 1 : 0) + (hasLottery ? 1 : 0);

    const points: { label: string; type: 'round' | 'intervention' | 'lottery'; count: number }[] =
      [];

    for (const { round, count } of nonZeroRounds)
      points.push({ label: `R${round}`, type: 'round', count });

    if (hasInterventions)
      points.push({ label: 'Interventions', type: 'intervention', count: interventionCount });

    if (hasLottery)
      points.push({ label: 'Lottery', type: 'lottery', count: filteredLotteryRecords.length });

    const maxCount = Math.max(
      ...nonZeroRounds.map(r => r.count),
      interventionCount,
      lotteryRecords.length,
      1,
    );

    const maxY =
      chartMode === 'remaining' && selectedLabId !== null && selectedLabQuota !== null
        ? selectedLabQuota
        : chartMode === 'remaining'
          ? totalStudents
          : maxCount;

    return points.map((point, index) => ({
      ...point,
      x: padding.left + (index / Math.max(totalPoints - 1, 1)) * chartWidth,
      y:
        chartMode === 'assigned'
          ? padding.top + chartHeight - (point.count / maxCount) * chartHeight
          : padding.top +
            chartHeight -
            ((selectedLabId !== null && selectedLabQuota !== null
              ? Math.max(0, selectedLabQuota - cumulativeUpTo(index, points))
              : totalStudents - cumulativeUpTo(index, points)) /
              maxY) *
              chartHeight,
    }));
  });

  function cumulativeUpTo(
    index: number,
    pts: { label: string; type: 'round' | 'intervention' | 'lottery'; count: number }[],
  ) {
    let drafted = 0;
    for (let i = 0; i <= index; i++) drafted += pts[i]!.count;
    return drafted;
  }

  const maxCount = $derived(Math.max(...chartData().map(p => p.count), 1));
  const chartMax = $derived(
    chartMode === 'remaining'
      ? selectedLabId !== null && selectedLabQuota !== null
        ? selectedLabQuota
        : totalStudents
      : maxCount,
  );

  const linePath = $derived(
    chartData().length > 0
      ? `M ${chartData()
          .map(p => `${p.x},${p.y}`)
          .join(' L ')}`
      : '',
  );

  const areaPath = $derived(
    chartData().length > 0
      ? `${linePath} L ${chartData().at(-1)!.x},${padding.top + chartHeight} L ${chartData()[0]!.x},${padding.top + chartHeight} Z`
      : '',
  );

  const yTicks = $derived(() => {
    const ticks: number[] = [];
    const step = Math.ceil(chartMax / 4);
    for (let i = 0; i <= chartMax; i += step) ticks.push(i);
    return ticks;
  });

  const selectedLabName = $derived(
    selectedLabId === null ? null : labs.find(l => l.id === selectedLabId)?.name,
  );
</script>

<Card.Root
  class="from-muted/30 to-muted/10 bg-gradient-to-br transition-all hover:-translate-y-1 hover:shadow-md"
>
  <Card.Header>
    <div class="flex flex-row items-center justify-between gap-4">
      <div>
        <Card.Title>Draft Timeline</Card.Title>
        <Card.Description>
          Students {chartMode === 'assigned'
            ? 'assigned'
            : selectedLabId === null
              ? 'remaining'
              : 'remaining quota'} per phase
          {#if selectedLabName}
            &mdash; {selectedLabName}
          {:else}
            &mdash; all labs
          {/if}
        </Card.Description>
      </div>
      <div class="flex items-center gap-2">
        <select
          bind:value={chartMode}
          class="border-border bg-background h-8 rounded-md border px-2 text-sm"
        >
          <option value="assigned">Assigned</option>
          <option value="remaining">Remaining</option>
        </select>
        <select
          bind:value={selectedLabId}
          class="border-border bg-background h-8 w-40 min-w-40 rounded-md border px-2 pr-8 text-sm"
        >
          <option value={null}>All Labs</option>
          {#each labs as lab (lab.id)}
            <option value={lab.id}>{lab.name}</option>
          {/each}
        </select>
      </div>
    </div></Card.Header
  >
  <Card.Content>
    <svg viewBox="0 0 {width} {height}" class="h-auto w-full">
      <defs>
        <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color="var(--primary)" stop-opacity={0.3} />
          <stop offset="95%" stop-color="var(--primary)" stop-opacity={0.05} />
        </linearGradient>
      </defs>

      {#each yTicks() as tick (tick)}
        {@const y = padding.top + chartHeight - (tick / chartMax) * chartHeight}
        <line
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="var(--border)"
          stroke-dasharray="4"
        />
        <text
          x={padding.left - 8}
          y={y + 4}
          text-anchor="end"
          class="fill-muted-foreground text-[10px]"
        >
          {tick}
        </text>
      {/each}

      <path d={areaPath} fill="url(#fillArea)" />

      <path
        d={linePath}
        fill="none"
        stroke="var(--primary)"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      {#each chartData() as point, index (point.label)}
        {@const remaining =
          selectedLabId !== null && selectedLabQuota !== null
            ? Math.max(0, selectedLabQuota - cumulativeUpTo(index, chartData()))
            : totalStudents - cumulativeUpTo(index, chartData())}
        <g
          role="button"
          tabindex="0"
          onmouseenter={() => (hoveredPoint = { ...point, remaining, x: point.x, y: point.y })}
          onmouseleave={() => (hoveredPoint = null)}
          onfocus={() => (hoveredPoint = { ...point, remaining, x: point.x, y: point.y })}
          onblur={() => (hoveredPoint = null)}
        >
          <circle
            cx={point.x}
            cy={point.y}
            r="6"
            fill="var(--primary)"
            class="hover:fill-primary/80 cursor-pointer"
          />
        </g>
      {/each}

      {#if hoveredPoint}
        {@const tooltipX = hoveredPoint.x - 5}
        {@const tooltipY = Math.min(hoveredPoint.y + 25, padding.top + chartHeight - 20)}
        <rect
          x={tooltipX - 10}
          y={tooltipY - 14}
          width="30"
          height="20"
          rx="4"
          fill="var(--foreground)"
          class="fill-background/95"
        />
        <text
          x={tooltipX + 5}
          y={tooltipY}
          text-anchor="middle"
          class="fill-foreground font-small text-[10px]"
        >
          {chartMode === 'assigned' ? hoveredPoint.count : hoveredPoint.remaining}
        </text>
      {/if}

      {#each chartData() as { label, x } (label)}
        <text {x} y={height - 8} text-anchor="middle" class="fill-muted-foreground text-[10px]">
          {label}
        </text>
      {/each}
    </svg>
  </Card.Content>
</Card.Root>
