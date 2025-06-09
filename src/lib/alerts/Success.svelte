<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { Snippet } from 'svelte';
  import { CheckCircle as src } from '@steeze-ui/heroicons';

  interface Props {
    children?: Snippet;
  }

  const { children }: Props = $props();
</script>

<div class="alert variant-soft-success">
  <Icon {src} class="size-8" />
  <div class="alert-message">{@render children?.()}</div>
</div>
