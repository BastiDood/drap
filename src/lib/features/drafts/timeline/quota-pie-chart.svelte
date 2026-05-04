<script lang="ts">
  import { PieChart } from 'layerchart';
  import { sum } from 'd3-array';

  import * as Chart from '$lib/components/ui/chart';
  import { assert } from '$lib/assert';
  import { CHART_COLORS } from '$lib/constants';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  interface Props {
    snapshots: DraftLabQuotaSnapshot[];
    mode: 'initial' | 'lottery';
  }

  const { snapshots, mode }: Props = $props();

  function chartColor(i: number) {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    assert(typeof color === 'string', 'chart color index out of bounds');
    return color;
  }

  function shortLabel({ labId }: Pick<DraftLabQuotaSnapshot, 'labId'>) {
    return labId.toUpperCase();
  }

  const totalQuota = $derived(
    sum(snapshots, s => (mode === 'initial' ? s.initialQuota : s.lotteryQuota)),
  );

  const hasQuota = $derived(totalQuota > 0);

  const chartConfig = $derived(
    Object.fromEntries(
      snapshots.map((snapshot, i) => [
        shortLabel(snapshot),
        {
          label: shortLabel(snapshot),
          color: chartColor(i),
        },
      ]),
    ),
  );

  const chartData = $derived(
    snapshots
      .filter(s => (mode === 'initial' ? s.initialQuota : s.lotteryQuota) > 0)
      .map((snapshot, i) => {
        const quota = mode === 'initial' ? snapshot.initialQuota : snapshot.lotteryQuota;
        return {
          key: shortLabel(snapshot),
          label: shortLabel(snapshot),
          labName: snapshot.labName,
          value: quota,
          percentage: totalQuota > 0 ? Math.round((quota / totalQuota) * 100) : 0,
          color: chartColor(i),
        };
      }),
  );
</script>

{#if hasQuota}
  <div class="flex w-full items-center justify-center gap-4">
    <Chart.Container id="quota-distribution-{mode}" config={chartConfig} class="max-h-56 flex-1">
      <PieChart
        data={chartData}
        key="key"
        value="value"
        label="label"
        c="color"
        padding={{ right: 15 }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip indicator="dot" />
        {/snippet}
      </PieChart>
    </Chart.Container>
    <div class="flex flex-col gap-1.5 text-sm">
      {#each chartData as data (data.key)}
        <div class="flex items-center gap-2">
          <span class="size-3 rounded-full" style="background-color: {data.color}"></span>
          <span class="font-medium">{data.key}</span>
          <span class="text-muted-foreground">{data.value} ({data.percentage}%)</span>
        </div>
      {/each}
      <div class="mt-2 border-t pt-2">
        <div class="flex items-center gap-2 font-semibold">
          <span>Total</span>
          <span>{totalQuota}</span>
        </div>
      </div>
    </div>
  </div>
{/if}
