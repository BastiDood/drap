<script>
    import { assert } from '$lib/assert';
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;

    const { draft } = data;
    assert(draft !== null);

    const { draft_id, curr_round, max_rounds, active_period_start } = draft;
    const startDate = format(active_period_start, 'PPP');
    const startTime = format(active_period_start, 'pp');
</script>

<div class="card prose dark:prose-invert max-w-none p-4">
    <p>
        {#if curr_round === null}
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
