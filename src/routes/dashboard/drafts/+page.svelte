<script>
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ draft } = data);
</script>

<h1 class="h1">Drafts</h1>
{#if draft === null}
    <WarningAlert>There is currently no active draft at the moment.</WarningAlert>
{:else}
    <!-- TODO: Create New Draft -->
{/if}
