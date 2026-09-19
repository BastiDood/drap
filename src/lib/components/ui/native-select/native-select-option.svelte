<script lang="ts">
  import type { WithElementRef } from '$lib/components/ui/utils';
  import type { HTMLOptionAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: WithElementRef<HTMLOptionAttributes> = $props();
</script>

<option bind:this={ref} data-slot="native-select-option" {...restProps}>
  {@render children?.()}
</option>
