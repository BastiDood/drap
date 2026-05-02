<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { BarChart } from 'layerchart/svg';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import * as Popover from '$lib/components/ui/popover';
  import { assert } from '$lib/assert';
  import type { DraftSupplyDemandEntry } from '$lib/features/drafts/types';

  interface Props {
    data: DraftSupplyDemandEntry[];
  }

  const { data }: Props = $props();

  const chartConfig = {
    supply: { label: 'Supply', color: 'var(--chart-1)' },
    demand: { label: 'Demand', color: 'var(--chart-3)' },
    actual: { label: 'Actual', color: 'var(--chart-2)' },
  };

  const labNameById = $derived(new Map(data.map(e => [e.labId.toUpperCase(), e.labName])));

  const chartData = $derived(
    data.map(entry => ({
      lab: entry.labId.toUpperCase(),
      supply: Math.round(entry.supplyShare * 100),
      demand: Math.round(entry.demandShare * 100),
      actual: Math.round(entry.actualShare * 100),
    })),
  );
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header>
    <Card.Title class="flex items-center gap-1.5">
      <span>Proportional Supply versus Demand versus Actual</span>
      <Popover.Root>
        <Popover.Trigger class="leading-none transition hover:opacity-80">
          <CircleHelpIcon class="size-3.5 text-muted-foreground" />
        </Popover.Trigger>
        <Popover.Content class="max-w-xs space-y-2 text-sm font-normal">
          <p>
            Each bar shows a lab's proportional share relative to all labs. All three series are
            normalized so they sum to 100%.
          </p>
          <ul class="list-disc space-y-1.5 pl-4">
            <li>
              <strong>Supply</strong>
              <math>
                <mo>(</mo>
                <msub><mi>q</mi><mi>i</mi></msub>
                <mo>/</mo>
                <mo>&sum;</mo><mi>q</mi>
                <mo>)</mo>
              </math>
              — the lab's share of total initial quota across all labs in the draft.
            </li>
            <li>
              <strong>Demand</strong>
              <math>
                <mo>(</mo>
                <msub><mi>B</mi><mi>i</mi></msub>
                <mo>/</mo>
                <mo>&sum;</mo><mi>B</mi>
                <mo>)</mo>
              </math>
              — the lab's share of preference-weighted demand. Each student's ranking assigns Borda points:
              a student who ranked <math><mi>n</mi></math> labs gives
              <math><mi>n</mi></math> points to their 1st choice,
              <math><mi>n</mi><mo>-</mo><mn>1</mn></math> to their 2nd, down to 1 for their last.
            </li>
            <li>
              <strong>Actual</strong>
              <math>
                <mo>(</mo>
                <msub><mi>a</mi><mi>i</mi></msub>
                <mo>/</mo>
                <mo>&sum;</mo><mi>a</mi>
                <mo>)</mo>
              </math>
              — the lab's share of students actually assigned after all draft phases.
            </li>
          </ul>
        </Popover.Content>
      </Popover.Root>
    </Card.Title>
    <Card.Description>
      Normalized share of capacity, Borda-weighted demand, and actual assignments per lab
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Chart.Container id="supply-demand-chart" config={chartConfig} class="max-h-[500px] w-full">
      <BarChart
        data={chartData}
        y="lab"
        orientation="horizontal"
        seriesLayout="group"
        groupPadding={0.1}
        bandPadding={0.3}
        padding={{ left: 50, top: 8, right: 10, bottom: 40 }}
        series={[
          { key: 'supply', label: 'Supply', color: 'var(--color-supply)' },
          { key: 'demand', label: 'Demand', color: 'var(--color-demand)' },
          { key: 'actual', label: 'Actual', color: 'var(--color-actual)' },
        ]}
        legend
        grid
        props={{
          xAxis: {
            format: (value: number) => `${value}%`,
            tickLabelProps: { dx: -4 },
          },
          yAxis: {
            grid: false,
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
            valueFormatter={value => `${value}%`}
          />
        {/snippet}
      </BarChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
