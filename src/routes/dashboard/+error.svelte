<script>
  import ErrorAlert from '$lib/alerts/Error.svelte';
  import { page } from '$app/state';
  const { status, error } = $derived(page);
</script>

{#if status === 499}
  <ErrorAlert>There is no active draft at the moment. Please check again later.</ErrorAlert>
{:else if error !== null}
  <ErrorAlert><strong>{status}:</strong> {error.message}</ErrorAlert>
{:else}
  <ErrorAlert><strong>{status}</strong></ErrorAlert>
{/if}
