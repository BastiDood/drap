<script>
    import SubmitRankings from './SubmitRankings.svelte';
    import { format } from 'date-fns';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ meta } = data);
</script>

{#if typeof meta === 'undefined'}
    <ErrorAlert>There is no active draft at the moment. Please check again later.</ErrorAlert>
{:else}
    {@const {
        draft: { draft_id, curr_round, max_rounds, active_period_start },
        info,
    } = meta}
    {@const startDate = format(active_period_start, 'PPP')}
    {@const startTime = format(active_period_start, 'pp')}
    {#if curr_round === 0}
        <div class="card prose max-w-none p-4 dark:prose-invert">
            <p>
                <strong>Draft &num;{draft_id}</strong> is currently on Round <strong>{curr_round}</strong>
                of <strong>{max_rounds}</strong>. It opened last <strong>{startDate}</strong> at
                <strong>{startTime}</strong>.
            </p>
        </div>
        {#if Array.isArray(info)}
            <SubmitRankings draftId={draft_id} maxRounds={max_rounds} availableLabs={info} />
        {:else}
            {@const { created_at, labs } = info}
            {@const creationDate = format(created_at, 'PPP')}
            {@const creationTime = format(created_at, 'pp')}
            <div class="card variant-ghost-secondary prose max-w-none p-4 dark:prose-invert">
                <p>
                    You have already submitted your lab preferences for this draft last <strong>{creationDate}</strong>
                    at
                    <strong>{creationTime}</strong>.
                </p>
                <ol>
                    {#each labs as lab}
                        <li>{lab}</li>
                    {/each}
                </ol>
            </div>
        {/if}
    {:else}
        <WarningAlert>
            <span
                >A draft that started last <strong>{startDate}</strong> at <strong>{startTime}</strong> is currently ongoing.
                You may no longer register.</span
            >
        </WarningAlert>
    {/if}
{/if}
