<script lang="ts">
  import { format } from 'd3-format';
  import { PieChart } from 'layerchart/svg';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import { assert } from '$lib/assert';
  import { CHART_COLORS } from '$lib/constants';
  import type { DraftLabDistributionEntry } from '$lib/features/drafts/types';

  interface Props {
    data: DraftLabDistributionEntry[];
  }

  const { data }: Props = $props();

  function chartColor(i: number) {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    assert(typeof color === 'string', 'chart color index out of bounds');
    return color;
  }

  function shortLabel(entry: DraftLabDistributionEntry) {
    return entry.labId === null ? 'Unassigned' : entry.labId.toUpperCase();
  }

  const percentFormat = format('.2~%');
  const integerFormat = format('d');

  const chartConfig = $derived(
    Object.fromEntries(
      data.map((entry, i) => {
        let subtitle = `${integerFormat(entry.count)} Student`;
        if (entry.count > 1) subtitle += 's';
        return [
          shortLabel(entry),
          {
            label: subtitle,
            color: chartColor(i),
          },
        ];
      }),
    ),
  );

  const chartData = $derived(
    data.map((entry, i) => ({
      key: shortLabel(entry),
      label: shortLabel(entry),
      labName: entry.labName,
      value: entry.count,
      color: chartColor(i),
    })),
  );

  const totalAssigned = $derived(data.reduce((sum, { count }) => sum + count, 0));
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header>
    <Card.Title>Students per Lab</Card.Title>
    <Card.Description>Distribution of assignments across labs</Card.Description>
  </Card.Header>
  <Card.Content>
    <Chart.Container id="lab-distribution-chart" config={chartConfig} class="max-h-70 w-full">
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
              return percentFormat(value / totalAssigned);
            }}
          />
        {/snippet}
      </PieChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
