<script lang="ts">
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import InfoIcon from '@lucide/svelte/icons/info';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { mode } from 'mode-watcher';
  import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';

  const props: SonnerProps = $props();
</script>

<Sonner
  theme={mode.current}
  class="toaster group"
  richColors
  closeButton
  --normal-bg="var(--color-popover)"
  --normal-text="var(--color-popover-foreground)"
  --normal-border="var(--color-border)"
  {...props}
  >{#snippet loadingIcon()}
    <Loader2Icon class="size-4 animate-spin" />
  {/snippet}
  {#snippet successIcon()}
    <CircleCheckIcon class="size-4" />
  {/snippet}
  {#snippet errorIcon()}
    <OctagonXIcon class="size-4" />
  {/snippet}
  {#snippet infoIcon()}
    <InfoIcon class="size-4" />
  {/snippet}
  {#snippet warningIcon()}
    <TriangleAlertIcon class="size-4" />
  {/snippet}
</Sonner>

<style>
  :global(
    .toaster[data-sonner-toaster][data-sonner-theme='light'],
    .toaster[data-sonner-toaster][data-sonner-theme='dark']
  ) {
    --success-bg: var(--color-success);
    --success-text: var(--color-success-foreground);
    --error-bg: var(--color-destructive);
    --error-text: var(--color-destructive-foreground);
    --warning-bg: var(--color-warning);
    --warning-text: var(--color-warning-foreground);
    --info-bg: var(--color-accent);
    --info-text: var(--color-accent-foreground);
  }
</style>
