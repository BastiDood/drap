<script lang="ts">
  import { format } from 'date-fns';

  import Callout from '$lib/components/callout.svelte';
  import { LabTable } from '$lib/features/labs';

  const { data } = $props();
  const { draft, labs } = $derived(data);
</script>

{#if typeof draft !== 'undefined' && draft.currRound !== null && draft.currRound > 0}
  {@const { id: draftId, activePeriodStart, currRound, maxRounds } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <Callout variant="warning" class="mb-4">
    <strong>Draft #{draftId}</strong> started last <strong>{startDate}</strong> at
    <strong>{startTime}</strong> and is now in Round <strong>{currRound}</strong> of
    <strong>{maxRounds}</strong>. Lab quotas are read-only while a draft is in progress.
  </Callout>
  <LabTable {labs} hasActiveDraft />
{:else}
  <LabTable {labs} hasActiveDraft={false} />
{/if}
