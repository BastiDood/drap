<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/components/ui/utils';

  interface Props extends WithElementRef<HTMLAttributes<HTMLDivElement>> {
    variant?: 'default' | 'soft';
  }

  let {
    ref = $bindable(null),
    variant = 'default',
    class: className,
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  bind:this={ref}
  data-slot="card"
  class={cn(
    'flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm',
    { 'border-0 shadow-none': variant === 'soft' },
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
