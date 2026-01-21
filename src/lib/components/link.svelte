<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAnchorAttributes, 'class'>;
  const { children, ...rest }: Props = $props();
</script>

<a
  {...rest}
  class="decoration-muted-foreground hover:text-muted-foreground/80 dark:hover:text-secondary underline underline-offset-3 transition"
  >{@render children?.()}</a
>
