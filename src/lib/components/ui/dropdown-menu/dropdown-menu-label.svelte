<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/components/ui/utils';

  interface Props extends WithElementRef<HTMLAttributes<HTMLDivElement>> {
    inset?: boolean;
  }

  let { ref = $bindable(null), class: className, inset, children, ...restProps }: Props = $props();
</script>

<div
  bind:this={ref}
  data-slot="dropdown-menu-label"
  data-inset={inset}
  class={cn('px-2 py-1.5 text-sm font-semibold data-inset:ps-8', className)}
  {...restProps}
>
  {@render children?.()}
</div>
