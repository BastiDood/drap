<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { format } from 'd3-format';
  import { PieChart } from 'layerchart/svg';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import * as Popover from '$lib/components/ui/popover';
  import { assert } from '$lib/assert';
  import { CHART_COLORS } from '$lib/constants';
  import type { DraftPreferenceAlignment } from '$lib/features/drafts/types';

  interface Props {
    data: DraftPreferenceAlignment;
  }

  const { data }: Props = $props();

  const NOT_PREFERRED = 'Not Preferred';

  function sliceColor(label: string, i: number) {
    if (label === NOT_PREFERRED) return 'var(--muted-foreground)';
    const color = CHART_COLORS[i % CHART_COLORS.length];
    assert(typeof color === 'string', 'chart color index out of bounds');
    return color;
  }

  const bordaFormat = format('.1~%');
  const percentFormat = format('.2~%');
  const integerFormat = format('d');

  const chartConfig = $derived(
    Object.fromEntries(
      data.slices.map(({ label, count }, i) => {
        let subtitle = `${integerFormat(count)} Student`;
        if (count > 1) subtitle += 's';
        return [label, { label: subtitle, color: sliceColor(label, i) }];
      }),
    ),
  );

  const chartData = $derived(
    data.slices.map(({ label, count }, i) => ({
      key: label,
      label,
      value: count,
      color: sliceColor(label, i),
    })),
  );

  const totalAssigned = $derived(data.slices.reduce((sum, { count }) => sum + count, 0));
</script>

<Card.Root
  class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header>
    <Card.Title class="flex items-center gap-1.5">
      <span>Preference Alignment</span>
      <Popover.Root>
        <Popover.Trigger class="leading-none transition hover:opacity-80">
          <CircleHelpIcon class="size-3.5 text-muted-foreground" />
        </Popover.Trigger>
        <Popover.Content class="text-sm font-normal">
          <ul class="list-disc space-y-1 pl-4">
            <li>Each slice shows how many students were assigned to their nth choice lab.</li>
            <li>
              <strong>Not Preferred</strong> means the student did not rank their assigned lab at all.
            </li>
          </ul>
        </Popover.Content>
      </Popover.Root>
    </Card.Title>
    <Card.Description>How well assignments match student preferences</Card.Description>
  </Card.Header>
  <Card.Content>
    <Chart.Container
      id="preference-alignment-chart"
      config={chartConfig}
      class="relative max-h-70 w-full"
    >
      <PieChart
        data={chartData}
        key="key"
        value="value"
        label="label"
        c="color"
        innerRadius={0.6}
        range={[270, 630]}
        padding={{ right: 100 }}
        legend={{ orientation: 'vertical', placement: 'right' }}
        props={{ pie: { sort: null } }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip
            indicator="dot"
            labelAccessor={d => {
              assert(typeof d === 'object' && d !== null && 'label' in d);
              return d.label;
            }}
            valueFormatter={value => {
              assert(typeof value === 'number');
              return percentFormat(value / totalAssigned);
            }}
          />
        {/snippet}
      </PieChart>
      <div
        class="pointer-events-none absolute inset-0 right-[100px] flex flex-col items-center justify-center"
      >
        <span class="text-3xl font-bold tabular-nums">{bordaFormat(data.bordaScore)}</span>
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Borda Score</span>
          <Popover.Root>
            <Popover.Trigger class="pointer-events-auto transition hover:opacity-80">
              <CircleHelpIcon class="size-3.5" />
            </Popover.Trigger>
            <Popover.Content class="pointer-events-auto max-w-xs space-y-2 text-sm">
              <p>
                Measures how closely each student's assignment matches their submitted preferences.
                Each student receives a satisfaction score, and the displayed percentage is the mean
                across all assigned students:
              </p>
              <math display="block">
                <mfrac>
                  <mn>1</mn>
                  <mi>N</mi>
                </mfrac>
                <munderover>
                  <mo>&sum;</mo>
                  <mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow>
                  <mi>N</mi>
                </munderover>
                <msub><mi>s</mi><mi>i</mi></msub>
              </math>
              <p>
                where each student's score is
                <math>
                  <msub><mi>s</mi><mi>i</mi></msub>
                  <mo>=</mo>
                  <mfrac>
                    <mrow>
                      <msub><mi>n</mi><mi>i</mi></msub>
                      <mo>-</mo>
                      <msub><mi>k</mi><mi>i</mi></msub>
                    </mrow>
                    <mrow>
                      <msub><mi>n</mi><mi>i</mi></msub>
                      <mo>-</mo>
                      <mn>1</mn>
                    </mrow>
                  </mfrac>
                </math>. Here, <math><msub><mi>n</mi><mi>i</mi></msub></math> is the number of labs
                the student ranked, and <math><msub><mi>k</mi><mi>i</mi></msub></math> is the 1-indexed
                position of their assigned lab within that ranking. A student assigned to their 1st choice
                scores 100%; their last choice scores 0%. Students who ranked only one lab automatically
                score 100%. Students assigned to a lab they never ranked score 0%.
              </p>
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>
    </Chart.Container>
  </Card.Content>
</Card.Root>
