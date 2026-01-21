<script>
  import CircleAlert from '@lucide/svelte/icons/circle-alert';

  import * as Alert from '$lib/components/ui/alert';
  import { page } from '$app/state';

  const { status, error } = $derived(page);
</script>

{#if error !== null}
  <Alert.Root variant="destructive">
    <CircleAlert />
    <Alert.Description><strong>{status}:</strong> {error.message}</Alert.Description>
  </Alert.Root>
{:else}
  <Alert.Root variant="destructive">
    <CircleAlert />
    <Alert.Description><strong>{status}</strong></Alert.Description>
  </Alert.Root>
{/if}
