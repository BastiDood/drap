<script>
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { draft_id, curr_round, max_rounds, active_period_start },
    } = data);
    $: startDate = format(active_period_start, 'PPP');
    $: startTime = format(active_period_start, 'pp');
</script>

<div class="card prose max-w-none p-4 dark:prose-invert">
    <p>
        {#if curr_round > max_rounds}
            <strong>Draft &num;{draft_id}</strong> (which opened last <strong>{startDate}</strong> at
            <strong>{startTime}</strong>) has recently finished the main drafting process. It is currently in the
            lottery rounds.
        {:else}
            <strong>Draft &num;{draft_id}</strong> is currently on Round <strong>{curr_round}</strong>
            of <strong>{max_rounds}</strong>. It opened last <strong>{startDate}</strong> at
            <strong>{startTime}</strong>.
        {/if}
    </p>
</div>
<slot />
