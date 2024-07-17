<script lang="ts">
    import DesignateForm from './DesignateForm.svelte';
    import ErrorAlert from '$lib/alerts/Error.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ senders } = data);
</script>

{#if senders.length > 0}
    <DesignateForm {senders} />
{:else}
    <ErrorAlert
        >There are no candidate email senders yet. <a href="/oauth/login?extended" class="anchor"
            >Be the first volunteer yourself as the email dispatcher.</a
        ></ErrorAlert
    >
{/if}
