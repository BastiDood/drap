<script lang="ts">
  import { cn } from '$lib/components/ui/utils';
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
  import type { ComponentProps } from 'svelte';

  interface Props extends ComponentProps<typeof DropdownMenuPrimitive.GroupHeading> {
    inset?: boolean;
  }

  let { ref = $bindable(null), class: className, inset, ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
  bind:ref
  data-slot="dropdown-menu-group-heading"
  data-inset={inset}
  class={cn('px-2 py-1.5 text-sm font-semibold data-inset:ps-8', className)}
  {...restProps}
/>
