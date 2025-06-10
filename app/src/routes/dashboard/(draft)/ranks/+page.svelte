<script>
    import { ProgressBar } from '@skeletonlabs/skeleton';
    import SubmitRankings from './SubmitRankings.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { id: draftId, currRound, maxRounds },
        availableLabs,
        rankings,
    } = data);
</script>

{#if typeof rankings === 'undefined'}
    <SubmitRankings {draftId} {maxRounds} {availableLabs} />
{:else}
    {@const { createdAt, labs } = rankings}
    {@const creationDate = format(createdAt, 'PPP')}
    {@const creationTime = format(createdAt, 'pp')}
    {#if currRound === null}
        <WarningAlert>A lottery is currently ongoing. You may join again soon in the next draft.</WarningAlert>
    {:else}
        <WarningAlert>A draft is currently ongoing. You may no longer register.</WarningAlert>
        <ProgressBar max={maxRounds} value={currRound} meter="bg-primary-600-300-token" />
    {/if}
    <div class="card variant-ghost-secondary prose dark:prose-invert max-w-none p-4">
        <p>
            You have already submitted your lab preferences for this draft last <strong>{creationDate}</strong> at
            <strong>{creationTime}</strong>.
        </p>
        {#if labs.length > 0}
            <ol>
                {#each labs as lab}
                    <li>{lab}</li>
                {/each}
            </ol>
        {:else}
            <p>You have selected none of the labs. You will thus skip ahead to the lottery phase.</p>
        {/if}
    </div>
{/if}
