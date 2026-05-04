<script lang="ts">
  import { format } from 'd3-format';
  import { PieChart } from 'layerchart/svg';
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
  const percentFormat = format('.2~%');
  const integerFormat = format('d');

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
      snapshots.map((snapshot, i) => {
        const quota = mode === 'initial' ? snapshot.initialQuota : snapshot.lotteryQuota;
        let label = `${integerFormat(quota)} Student`;
        if (quota !== 1) label += 's';
        return [
          shortLabel(snapshot),
          {
            label,
            color: chartColor(i),
          },
        ];
      }),
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
          color: chartColor(i),
        };
      }),
  );
</script>

{#if hasQuota}
  <Chart.Container id="quota-distribution-{mode}" config={chartConfig} class="max-h-70 w-full">
    <PieChart
      data={chartData}
      key="key"
      value="value"
      label="label"
      c="color"
      padding={{ right: 65 }}
      legend={{ orientation: 'vertical', placement: 'right' }}
    >
      {#snippet tooltip()}
        <Chart.Tooltip
          indicator="dot"
          labelAccessor={d => {
            assert(typeof d === 'object' && d !== null && 'labName' in d);
            return d.labName;
          }}
          valueFormatter={value => {
            assert(typeof value === 'number');
            return percentFormat(value / totalQuota);
          }}
        />
      {/snippet}
    </PieChart>
  </Chart.Container>
{/if}
