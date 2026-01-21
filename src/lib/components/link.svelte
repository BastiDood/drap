<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAnchorAttributes, 'class'>;
  const { children, ...rest }: Props = $props();
</script>

<a
  {...rest}
  class="decoration-muted-foreground hover:text-secondary-foreground underline underline-offset-3 transition"
  >{@render children?.()}</a
>
