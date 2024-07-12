<script>
    import SubmitRankings from './SubmitRankings.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { draft_id, curr_round, max_rounds },
        info,
    } = data);
</script>

{#if curr_round === null}
    <WarningAlert>A lottery is currently ongoing. You may join again soon in the next draft.</WarningAlert>
{:else if curr_round > 0}
    <WarningAlert>A draft is currently ongoing. You may no longer register.</WarningAlert>
{:else if Array.isArray(info)}
    <SubmitRankings draftId={draft_id} maxRounds={max_rounds} availableLabs={info} />
{:else}
    {@const { created_at, labs } = info}
    {@const creationDate = format(created_at, 'PPP')}
    {@const creationTime = format(created_at, 'pp')}
    <div class="card variant-ghost-secondary prose max-w-none p-4 dark:prose-invert">
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
