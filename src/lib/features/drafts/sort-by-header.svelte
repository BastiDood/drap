<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  import { cn } from '$lib/components/ui/utils';

  interface Props extends HTMLButtonAttributes {
    header: string;
    sortState: false | 'asc' | 'desc';
  }

  const { header, sortState, class: className, ...restProps }: Props = $props();
</script>

<button
  type="button"
  class={cn(
    'inline-flex cursor-pointer items-center gap-1 rounded-sm p-0 text-inherit transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
    className,
  )}
  {...restProps}
>
  <span>{header}</span>
  <span class="flex w-4 items-center justify-center text-muted-foreground">
    {#if sortState === 'asc'}
      <ArrowUpIcon class="size-4" />
    {:else if sortState === 'desc'}
      <ArrowDownIcon class="size-4" />
    {:else}
      <ArrowUpDownIcon class="size-4" />
    {/if}
  </span>
</button>
