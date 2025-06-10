<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { Snippet } from 'svelte';
  import { ExclamationTriangle as src } from '@steeze-ui/heroicons';

  interface Props {
    children?: Snippet;
  }

  const { children }: Props = $props();
</script>

<div class="alert variant-soft-warning">
  <span><Icon {src} class="w-8" /></span>
  <div class="alert-message">{@render children?.()}</div>
</div>
