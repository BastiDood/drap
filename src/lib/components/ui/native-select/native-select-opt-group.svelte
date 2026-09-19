<script lang="ts">
  import type { WithElementRef } from '$lib/components/ui/utils';
  import type { HTMLOptgroupAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: WithElementRef<HTMLOptgroupAttributes> = $props();
</script>

<optgroup bind:this={ref} data-slot="native-select-opt-group" {...restProps}>
  {@render children?.()}
</optgroup>
