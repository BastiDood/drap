<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import type { Snippet } from 'svelte';

  import * as Alert from '$lib/components/ui/alert';
  import type { AlertBorder, AlertVariant } from '$lib/components/ui/alert';

  let {
    variant,
    border,
    title,
    class: className,
    children,
  }: {
    variant: AlertVariant;
    border?: AlertBorder;
    title?: string;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<Alert.Root {variant} {border} class={className}>
  {#if variant === 'destructive'}
    <CircleAlertIcon />
  {:else if variant === 'success'}
    <CheckCircleIcon />
  {:else if variant === 'warning'}
    <TriangleAlertIcon />
  {/if}
  {#if title}
    <Alert.Title class="font-semibold">
      {title}
    </Alert.Title>
  {/if}
  <Alert.Description>
    <p>{@render children()}</p>
  </Alert.Description>
</Alert.Root>
