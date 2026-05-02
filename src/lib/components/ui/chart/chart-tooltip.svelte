<script lang="ts">
  import { getChartContext } from 'layerchart';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import { Tooltip as TooltipPrimitive } from 'layerchart/svg';

  import { cn, type WithElementRef, type WithoutChildren } from '$lib/components/ui/utils';

  import { getPayloadConfigFromPayload, type TooltipPayload, useChart } from './chart-utils';

  function defaultFormatter(value: unknown, _: TooltipPayload[]) {
    return `${value}`;
  }

  interface Props extends WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> {
    hideLabel?: boolean;
    label?: string;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
    hideIndicator?: boolean;
    labelClassName?: string;
    labelAccessor?: ((data: unknown) => unknown) | null;
    labelFormatter?:
      | ((value: unknown, payload: TooltipPayload[]) => string | number | Snippet)
      | null;
    valueFormatter?: ((value: unknown) => string | number) | null;
    formatter?: Snippet<
      [
        {
          value: unknown;
          label: string;
          item: TooltipPayload;
          index: number;
          payload: TooltipPayload[];
        },
      ]
    >;
  }

  let {
    ref = $bindable(null),
    class: className,
    hideLabel = false,
    indicator = 'dot',
    hideIndicator = false,
    labelKey,
    label,
    labelAccessor = null,
    labelFormatter = defaultFormatter,
    valueFormatter = null,
    labelClassName,
    formatter,
    nameKey,
    color,
    ...restProps
  }: Props = $props();

  const chart = useChart();
  const ctx = getChartContext();

  const tooltipPayload: TooltipPayload[] = $derived(
    ctx.tooltip.series.filter(
      ({ visible, value }) => visible && value !== null && typeof value !== 'undefined',
    ),
  );

  const formattedLabel = $derived.by(() => {
    if (hideLabel || tooltipPayload.length === 0) return null;

    const [item] = tooltipPayload;

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let value: unknown;
    if (typeof label === 'string') {
      value = chart.config[label as keyof typeof chart.config]?.label ?? label;
    } else if (labelKey) {
      const itemConfig = getPayloadConfigFromPayload(chart.config, item, labelKey);
      value = itemConfig?.label ?? item?.label;
    } else if (labelAccessor !== null) {
      value =
        ctx.tooltip.data === null || typeof ctx.tooltip.data === 'undefined'
          ? null
          : labelAccessor(ctx.tooltip.data);
    }

    if (value === null || typeof value === 'undefined') return null;
    if (labelFormatter === null) return value;
    return labelFormatter(value, tooltipPayload);
  });

  const nestLabel = $derived(tooltipPayload.length === 1 && indicator !== 'dot');
</script>

{#snippet tooltipLabel()}
  {#if formattedLabel}
    <div class={cn('font-medium', labelClassName)}>
      {#if typeof formattedLabel === 'function'}
        {@render formattedLabel()}
      {:else}
        {formattedLabel}
      {/if}
    </div>
  {/if}
{/snippet}

<TooltipPrimitive.Root variant="none" portal={false}>
  {#if tooltipPayload.length > 0}
    <div
      bind:this={ref}
      class={cn(
        'grid min-w-36 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
      {...restProps}
    >
      {#if !nestLabel}
        {@render tooltipLabel()}
      {/if}
      <div class="grid gap-1.5">
        {#each tooltipPayload as item, i (item.key + i)}
          {@const key = nameKey || item.key || item.label || 'value'}
          {@const itemConfig = getPayloadConfigFromPayload(chart.config, item, key)}
          {@const indicatorColor = color || item.color}
          <div
            class={cn(
              'flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-muted-foreground',
              indicator === 'dot' && 'items-center',
            )}
          >
            {#if typeof formatter !== 'undefined' && typeof item.value !== 'undefined' && item.label}
              {@render formatter({
                value: item.value,
                label: item.label,
                item,
                index: i,
                payload: tooltipPayload,
              })}
            {:else}
              {#if typeof itemConfig?.icon !== 'undefined'}
                <itemConfig.icon />
              {:else if !hideIndicator}
                <div
                  style="--color-bg: {indicatorColor}; --color-border: {indicatorColor};"
                  class={cn('shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)', {
                    'size-2.5': indicator === 'dot',
                    'h-full w-1': indicator === 'line',
                    'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                    'my-0.5': nestLabel && indicator === 'dashed',
                  })}
                ></div>
              {/if}
              <div
                class={cn(
                  'flex shrink-0 grow justify-between leading-none',
                  nestLabel ? 'items-end' : 'items-center',
                )}
              >
                <div class="grid gap-1.5">
                  {#if nestLabel}
                    {@render tooltipLabel()}
                  {/if}
                  <span class="text-muted-foreground">
                    {itemConfig?.label || item.label}
                  </span>
                </div>
                {#if typeof item.value !== 'undefined' && item.value !== null}
                  <span class="font-mono font-medium text-foreground tabular-nums">
                    {valueFormatter === null ? item.value : valueFormatter(item.value)}
                  </span>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</TooltipPrimitive.Root>
