<script>
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ draft } = data);
</script>

{#if typeof draft !== 'undefined'}
    {@const { id: draftId, currRound, maxRounds, activePeriodStart } = draft}
    {@const startDate = format(activePeriodStart, 'PPP')}
    {@const startTime = format(activePeriodStart, 'pp')}
    <div class="card prose dark:prose-invert max-w-none p-4">
        <p>
            {#if currRound === null}
                <strong>Draft &num;{draftId}</strong> (which opened last <strong>{startDate}</strong> at
                <strong>{startTime}</strong>) has recently finished the main drafting process. It is currently in the
                lottery rounds.
            {:else}
                <strong>Draft &num;{draftId}</strong> is currently on Round <strong>{currRound}</strong>
                of <strong>{maxRounds}</strong>. It opened last <strong>{startDate}</strong> at
                <strong>{startTime}</strong>.
            {/if}
        </p>
    </div>
{/if}
<slot />
