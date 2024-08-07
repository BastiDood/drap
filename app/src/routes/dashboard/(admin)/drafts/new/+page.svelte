<script>
    import ErrorAlert from '$lib/alerts/Error.svelte';

    import InitForm from './InitForm.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs } = data);
</script>

{#if labs.some(({ quota }) => quota > 0)}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div class="prose dark:prose-invert">
            <h2>Start a New Draft</h2>
            <p>
                Welcome to the <strong>Draft Ranking Automated Processor</strong>! There are currently no drafts
                happening at the moment, but as an administrator, you have the authorization to start a new one.
            </p>
            <p>
                To begin, simply provide the the maximum number of rounds for the upcoming draft. This has historically
                been set to <strong>5</strong>.
            </p>
        </div>
        <InitForm />
    </div>
{:else}
    <ErrorAlert
        >The total quota of all labs is currently zero. Please <a href="/dashboard/labs/" class="anchor">allocate</a> at
        least one slot to a lab to proceed.</ErrorAlert
    >
{/if}
