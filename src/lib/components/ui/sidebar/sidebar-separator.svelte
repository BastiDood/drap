<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { cn } from '$lib/components/ui/utils';
  import { Separator } from '$lib/components/ui/separator';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="sidebar-separator"
  data-sidebar="separator"
  class={cn('bg-sidebar-border', className)}
  {...restProps}
/>
