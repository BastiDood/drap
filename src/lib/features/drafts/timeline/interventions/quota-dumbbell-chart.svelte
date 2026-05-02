<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { BarChart } from 'layerchart/svg';
  import { format } from 'd3-format';
  import { max } from 'd3-array';
  import { scaleLinear } from 'd3-scale';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import * as Popover from '$lib/components/ui/popover';
  import DraftedDraftees from '$lib/features/drafts/draftees/drafted/index.svelte';
  import { assert } from '$lib/assert';
  import type { DumbbellRow } from '$lib/features/drafts/types';

  interface Props {
    draftId: string;
    rows: DumbbellRow[];
  }

  const { draftId, rows }: Props = $props();

  const integerFormat = format('d');

  const chartConfig = {
    naturalLeftover: { label: 'Regular-Round Vacancies', color: 'var(--chart-1)' },
    lotteryQuota: { label: 'Lottery Quota', color: 'var(--chart-2)' },
  };

  const chartData = $derived(
    rows.map(row => ({
      ...row,
      lab: row.labId.toUpperCase(),
    })),
  );

  const xDomain = $derived.by(() => {
    const domain = scaleLinear()
      .domain([0, max(chartData, row => Math.max(row.naturalLeftover, row.lotteryQuota)) ?? 1])
      .nice(4)
      .domain();

    return [domain[0] ?? 0, domain[1] ?? 1];
  });

  const chartSeries = $derived([
    {
      key: 'naturalLeftover',
      label: 'Regular-Round Vacancies',
      color: 'var(--color-naturalLeftover)',
    },
    {
      key: 'lotteryQuota',
      label: 'Lottery Quota',
      color: 'var(--color-lotteryQuota)',
    },
  ]);

  const chartHeightPx = $derived(Math.max(220, chartData.length * 52 + 96));
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header class="gap-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="space-y-1">
        <Card.Title class="flex items-center gap-1.5">
          <span>Regular-Round Vacancies vs. Lottery Quota</span>
          <Popover.Root>
            <Popover.Trigger class="leading-none transition hover:opacity-80">
              <CircleHelpIcon class="size-3.5 text-muted-foreground" />
            </Popover.Trigger>
            <Popover.Content class="max-w-xs space-y-2 text-sm font-normal">
              <p>
                Each row compares the lab's vacancies after regular rounds with its final lottery
                quota.
              </p>
              <ul class="list-disc space-y-1.5 pl-4">
                <li>
                  <strong>Regular-Round Vacancies</strong> are the lab seats left open after the regular
                  faculty selection rounds.
                </li>
                <li>
                  <strong>Lottery Quota</strong> is the final number of lottery seats allocated to the
                  lab.
                </li>
                <li>
                  Regular-round vacancies are
                  <math>
                    <msub><mi>V</mi><mi>l</mi></msub>
                    <mo>=</mo>
                    <msub><mi>I</mi><mi>l</mi></msub>
                    <mo>-</mo>
                    <msub><mi>R</mi><mi>l</mi></msub>
                  </math>, where
                  <math><msub><mi>I</mi><mi>l</mi></msub></math>
                  is the lab's initial quota and
                  <math><msub><mi>R</mi><mi>l</mi></msub></math>
                  is the number of students assigned to that lab during regular rounds.
                </li>
                <li>
                  The intervention shift is
                  <math>
                    <msub><mi>&Delta;</mi><mi>l</mi></msub>
                    <mo>=</mo>
                    <msub><mi>Q</mi><mi>l</mi></msub>
                    <mo>-</mo>
                    <msub><mi>V</mi><mi>l</mi></msub>
                  </math>, where
                  <math><msub><mi>Q</mi><mi>l</mi></msub></math>
                  is the lottery quota for lab
                  <math><mi>l</mi></math>.
                </li>
              </ul>
            </Popover.Content>
          </Popover.Root>
        </Card.Title>
        <Card.Description>
          Regular-round vacancies compared with final lottery quota.
        </Card.Description>
      </div>
      <DraftedDraftees {draftId} triggerSize="sm" />
    </div>
  </Card.Header>
  <Card.Content>
    {#if rows.length === 0}
      <p class="text-sm text-muted-foreground">No quota data available.</p>
    {:else}
      <Chart.Container
        id="quota-dumbbell-chart"
        config={chartConfig}
        class="w-full"
        style="height: {chartHeightPx}px;"
      >
        <BarChart
          data={chartData}
          y="lab"
          orientation="horizontal"
          seriesLayout="group"
          {xDomain}
          series={chartSeries}
          legend={false}
          grid
          groupPadding={0.15}
          bandPadding={0.3}
          padding={{ left: 70, top: 12, right: 32, bottom: 36 }}
          props={{
            xAxis: {
              format: (value: number) => integerFormat(value),
              tickLabelProps: { dx: -4 },
            },
            yAxis: { grid: false },
            bars: { radius: 4, strokeWidth: 1 },
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip
              indicator="dot"
              labelAccessor={d => {
                assert(typeof d === 'object' && d !== null && 'labName' in d);
                return d.labName;
              }}
              valueFormatter={value => integerFormat(Number(value))}
            />
          {/snippet}
        </BarChart>
      </Chart.Container>
    {/if}
  </Card.Content>
</Card.Root>
