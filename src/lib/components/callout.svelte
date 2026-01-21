<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert';
  import type { AlertVariant } from '$lib/components/ui/alert';

  let { variant, description }: { variant: AlertVariant; description: string } = $props();
</script>

<Alert.Root {variant}>
  {#if variant === 'destructive'}
    <CircleAlertIcon />
  {:else if variant === 'success'}
    <CheckCircleIcon />
  {:else if variant === 'warning'}
    <TriangleAlertIcon />
  {/if}
  <Alert.Description>{description}</Alert.Description>
</Alert.Root>
