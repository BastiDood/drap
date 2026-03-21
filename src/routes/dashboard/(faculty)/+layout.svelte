<script lang="ts">
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';

  const { data, children } = $props();
  const {
    draft: {
      id,
      currRound,
      maxRounds,
      registrationClosesAt,
      activePeriodStart,
      isRegistrationClosed,
    },
  } = $derived(data);
  const startDate = $derived(format(activePeriodStart, 'PPP'));
  const startTime = $derived(format(activePeriodStart, 'pp'));
  const closeDate = $derived(format(registrationClosesAt, 'PPP'));
  const closeTime = $derived(format(registrationClosesAt, 'pp'));
</script>

<Alert.Root variant="info">
  <Alert.Description class="prose max-w-none dark:prose-invert">
    <p>
      {#if currRound === null}
        <strong>Draft #{id}</strong> (which opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>) has completed lottery assignment and is now under review by
        the draft administrators.
      {:else if currRound > maxRounds}
        <strong>Draft #{id}</strong> (which opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>) has recently finished the main drafting process. It is
        currently in the lottery round.
      {:else}
        <strong>Draft #{id}</strong> is currently on Round <strong>{currRound}</strong>
        of <strong>{maxRounds}</strong>. It opened last <strong>{startDate}</strong> at
        <strong>{startTime}</strong>.
        {#if currRound === 0 && !isRegistrationClosed}
          Draft registration is currently open and will close on <strong>{closeDate}</strong> at
          <strong>{closeTime}</strong>.
        {:else}
          Draft registration closed on <strong>{closeDate}</strong> at <strong>{closeTime}</strong>.
        {/if}
      {/if}
    </p>
  </Alert.Description>
</Alert.Root>
{@render children?.()}
