<script lang="ts">
  import { format } from 'date-fns';

  const { data, children } = $props();
  const { draft } = $derived(data);
</script>

{#if typeof draft !== 'undefined'}
  {@const { id: draftId, currRound, maxRounds, registrationClosesAt, activePeriodStart } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  {@const closeDate = format(registrationClosesAt, 'PPP')}
  {@const closeTime = format(registrationClosesAt, 'pp')}
  <div class="card prose dark:prose-invert max-w-none p-4">
    <p>
      {#if currRound === null}
        <strong>Draft #{draftId}</strong> (which opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>) has recently finished the main drafting process. It is
        currently in the lottery rounds.
      {:else}
        <strong>Draft #{draftId}</strong> is currently on Round <strong>{currRound}</strong>
        of <strong>{maxRounds}</strong>. It opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>.
        {#if registrationClosesAt >= new Date()}
          Draft registration is currently open and will close on <strong>{closeDate}</strong> at <strong>{closeTime}</strong>.
        {:else}
          Draft registration closed on <strong>{closeDate}</strong> at <strong>{closeTime}</strong>.
        {/if}
      {/if}
    </p>
  </div>
{/if}
{@render children?.()}
