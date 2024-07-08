<script>
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { page } from '$app/stores';
    $: ({ status, error } = $page);
</script>

{#if status === 499}
    <ErrorAlert>There is no active draft at the moment. Please check again later.</ErrorAlert>
{:else if error !== null}
    <ErrorAlert><strong>{status}:</strong> {error.message}</ErrorAlert>
{/if}
