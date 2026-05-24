<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import { tv, type VariantProps } from 'tailwind-variants';

  import { cn } from '$lib/components/ui/utils';

  export const statCardGroupVariants = tv({
    base: 'grid w-full grid-cols-1 gap-2',
    variants: {
      columns: {
        one: '@lg:w-fit @lg:grid-cols-[repeat(1,minmax(10rem,14rem))]',
        two: '@lg:w-fit @lg:grid-cols-[repeat(2,minmax(10rem,14rem))]',
        five: '@lg:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-5',
      },
    },
  });

  export type StatCardGroupColumns = VariantProps<typeof statCardGroupVariants>['columns'];
  interface Props {
    children: Snippet;
    columns: StatCardGroupColumns;
    class?: string;
  }
</script>

<script lang="ts">
  const { children, columns, class: className }: Props = $props();
</script>

<div class="@container">
  <div class={cn(statCardGroupVariants({ columns }), className)}>
    {@render children()}
  </div>
</div>
