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
    children,
  }: { variant: AlertVariant; border?: AlertBorder; children: Snippet } = $props();
</script>

<Alert.Root {variant} {border}>
  {#if variant === 'destructive'}
    <CircleAlertIcon />
  {:else if variant === 'success'}
    <CheckCircleIcon />
  {:else if variant === 'warning'}
    <TriangleAlertIcon />
  {/if}
  <Alert.Description>
    <p>{@render children()}</p>
  </Alert.Description>
</Alert.Root>
