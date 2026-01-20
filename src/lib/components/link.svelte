<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAnchorAttributes, 'class'>;
  const { children, ...rest }: Props = $props();
</script>

<a
  {...rest}
  class="hover:text-secondary-500 decoration-surface-400 underline underline-offset-3 transition"
  >{@render children?.()}</a
>
