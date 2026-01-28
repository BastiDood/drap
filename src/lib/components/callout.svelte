<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleX from '@lucide/svelte/icons/circle-x';
  import InfoIcon from '@lucide/svelte/icons/info';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import type { Snippet } from 'svelte';

  import * as Alert from '$lib/components/ui/alert';
  import type { AlertBorder, AlertVariant } from '$lib/components/ui/alert';

  interface Props {
    variant: AlertVariant;
    border?: AlertBorder;
    title?: string;
    class?: string;
    children: Snippet;
  }

  let { variant, border, title, class: className, children }: Props = $props();
</script>

<Alert.Root {variant} {border} class={className}>
  {#if variant === 'destructive'}
    <CircleX />
  {:else if variant === 'success'}
    <CheckCircleIcon />
  {:else if variant === 'warning'}
    <TriangleAlertIcon />
  {:else if variant === 'info'}
    <InfoIcon />
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
