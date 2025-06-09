<script lang="ts">
  import { format } from 'date-fns';

  const { data, children } = $props();
  const { draft } = $derived(data);
</script>

{#if typeof draft !== 'undefined'}
  {@const { id: draftId, currRound, maxRounds, activePeriodStart } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <div class="card prose max-w-none p-4 dark:prose-invert">
    <p>
      {#if currRound === null}
        <strong>Draft &num;{draftId}</strong> (which opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>) has recently finished the main drafting process. It is
        currently in the lottery rounds.
      {:else}
        <strong>Draft &num;{draftId}</strong> is currently on Round <strong>{currRound}</strong>
        of <strong>{maxRounds}</strong>. It opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>.
      {/if}
    </p>
  </div>
{/if}
{@render children?.()}
