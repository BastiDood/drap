<script>
  import CircleAlert from '@lucide/svelte/icons/circle-alert';

  import * as Alert from '$lib/components/ui/alert';
  import { page } from '$app/state';

  const { status, error } = $derived(page);
</script>

{#if status === 499}
  <Alert.Root variant="destructive">
    <CircleAlert />
    <Alert.Description
      >There is no active draft at the moment. Please check again later.</Alert.Description
    >
  </Alert.Root>
{:else if error !== null}
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
