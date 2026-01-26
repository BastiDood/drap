<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const alertVariants = tv({
    base: 'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border-2 px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive: 'preset-tonal-destructive',
        success: 'preset-tonal-success',
        warning: 'preset-tonal-warning',
        info: 'preset-tonal-accent',
      },
      border: {
        sm: 'border-1',
        md: 'border-2',
        lg: 'border-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      border: 'md',
    },
  });

  export type AlertVariant = VariantProps<typeof alertVariants>['variant'];
  export type AlertBorder = VariantProps<typeof alertVariants>['border'];
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/components/ui/utils';

  let {
    ref = $bindable(null),
    class: className,
    variant = 'default',
    border = 'md',
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: AlertVariant;
    border?: AlertBorder;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert"
  class={cn(alertVariants({ variant, border }), className)}
  {...restProps}
  role="alert"
>
  {@render children?.()}
</div>
