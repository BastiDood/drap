<script>
    import SubmitRankings from './SubmitRankings.svelte';
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { curr_round, max_rounds, active_period_start },
        info,
    } = data);
    $: startDate = format(active_period_start, 'PPP');
    $: startTime = format(active_period_start, 'pp');
</script>

<div class="card prose max-w-none p-4 dark:prose-invert">
    <p>
        This draft is currently on Round <strong>{curr_round}</strong> of <strong>{max_rounds}</strong>. It opened last
        <strong>{startDate}</strong>
        at <strong>{startTime}</strong>.
    </p>
</div>
{#if Array.isArray(info)}
    <SubmitRankings maxRounds={max_rounds} availableLabs={info} />
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
