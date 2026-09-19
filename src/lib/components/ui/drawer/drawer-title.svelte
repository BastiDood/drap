<script lang="ts">
  import { cn } from '$lib/components/ui/utils';
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: DrawerPrimitive.TitleProps = $props();
</script>

<DrawerPrimitive.Title
  bind:ref
  data-slot="drawer-title"
  class={cn('font-semibold text-foreground', className)}
  {...restProps}
/>
