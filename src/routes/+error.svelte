<script>
  import Callout from '$lib/components/callout.svelte';
  import { page } from '$app/state';

  const { status, error } = $derived(page);
</script>

{#if error !== null}
  <Callout variant="destructive"><strong>{status}:</strong> {error.message}</Callout>
{:else}
  <Callout variant="destructive"><strong>{status}</strong></Callout>
{/if}
