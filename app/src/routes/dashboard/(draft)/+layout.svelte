<script>
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { id, currRound, maxRounds, activePeriodStart },
    } = data);
    $: startDate = format(activePeriodStart, 'PPP');
    $: startTime = format(activePeriodStart, 'pp');
</script>

<div class="card prose dark:prose-invert max-w-none p-4">
    <p>
        {#if currRound === null}
            <strong>Draft &num;{id}</strong> (which opened last <strong>{startDate}</strong> at
            <strong>{startTime}</strong>) has recently finished the main drafting process. It is currently in the
            lottery round.
        {:else}
            <strong>Draft &num;{id}</strong> is currently on Round <strong>{currRound}</strong>
            of <strong>{maxRounds}</strong>. It opened last <strong>{startDate}</strong> at
            <strong>{startTime}</strong>.
        {/if}
    </p>
</div>
<slot />
