<script lang="ts">
  import { format } from 'date-fns';

  const { data, children } = $props();
  const {
    draft: { id, currRound, maxRounds, registrationClosesAt, activePeriodStart },
    requestedAt,
  } = $derived(data);
  const startDate = $derived(format(activePeriodStart, 'PPP'));
  const startTime = $derived(format(activePeriodStart, 'pp'));
  const closeDate = $derived(format(registrationClosesAt, 'PPP'));
  const closeTime = $derived(format(registrationClosesAt, 'pp'));
</script>

<div class="card prose dark:prose-invert max-w-none p-4">
  <p>
    {#if currRound === null}
      <strong>Draft #{id}</strong> (which opened last <strong>{startDate}</strong> at
      <strong>{startTime}</strong>) has recently finished the main drafting process. It is currently
      in the lottery round.
    {:else}
      <strong>Draft #{id}</strong> is currently on Round <strong>{currRound}</strong>
      of <strong>{maxRounds}</strong>. It opened last <strong>{startDate}</strong> at
      <strong>{startTime}</strong>.
      {#if currRound === 0 && requestedAt < registrationClosesAt}
        Draft registration is currently open and will close on <strong>{closeDate}</strong> at
        <strong>{closeTime}</strong>.
      {:else}
        Draft registration closed on <strong>{closeDate}</strong> at <strong>{closeTime}</strong>.
      {/if}
    {/if}
  </p>
</div>
{@render children?.()}
