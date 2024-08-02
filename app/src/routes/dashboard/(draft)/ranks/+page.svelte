<script>
    import { ProgressBar } from '@skeletonlabs/skeleton';
    import SubmitRankings from './SubmitRankings.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { draft_id, curr_round, max_rounds },
        availableLabs,
        rankings,
    } = data);
</script>

{#if rankings === null}
    <SubmitRankings draftId={draft_id} maxRounds={max_rounds} {availableLabs} />
{:else}
    {@const { created_at, labs } = rankings}
    {@const creationDate = format(created_at, 'PPP')}
    {@const creationTime = format(created_at, 'pp')}
    {#if curr_round === null}
        <WarningAlert>A lottery is currently ongoing. You may join again soon in the next draft.</WarningAlert>
    {:else}
        <WarningAlert>A draft is currently ongoing. You may no longer register.</WarningAlert>
        <ProgressBar max={max_rounds} value={curr_round} meter="bg-primary-600-300-token" />
    {/if}
    <div class="card variant-ghost-secondary prose dark:prose-invert max-w-none p-4">
        <p>
            You have already submitted your lab preferences for this draft last <strong>{creationDate}</strong> at
            <strong>{creationTime}</strong>.
        </p>
        <ol>
            {#each labs as lab}
                <li>{lab}</li>
            {/each}
        </ol>
    </div>
{/if}
