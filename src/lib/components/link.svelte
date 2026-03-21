<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  import { cn } from '$lib/components/ui/utils';

  type Props = HTMLAnchorAttributes;
  const { children, class: className = '', ...rest }: Props = $props();
</script>

<a
  {...rest}
  class={cn(
    `underline decoration-muted-foreground underline-offset-3 transition hover:text-muted-foreground/80 dark:hover:text-secondary`,
    className,
  )}>{@render children?.()}</a
>
