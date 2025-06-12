<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { Snippet } from 'svelte';
  import { ExclamationTriangle as src } from '@steeze-ui/heroicons';

  interface Props {
    children?: Snippet;
  }

  const { children }: Props = $props();
</script>

<div class="card preset-tonal-warning flex items-center gap-2 p-4 shadow-sm">
  <Icon {src} class="max-w-8" />
  <div>{@render children?.()}</div>
</div>
