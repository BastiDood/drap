<script lang="ts">
  import { format } from 'date-fns';

  import Callout from '$lib/components/callout.svelte';
  import { LabTable } from '$lib/features/labs';

  const { data } = $props();
  const { draft, labs } = $derived(data);
  const isRegistrationActive = $derived(typeof draft !== 'undefined' && draft.currRound === 0);
</script>

{#if typeof draft !== 'undefined'}
  {@const { id: draftId, activePeriodStart } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  {#if isRegistrationActive}
    <Callout variant="destructive" class="mb-4">
      <strong>Draft #{draftId}</strong> registration is ongoing. The lab catalog is locked to prevent
      inconsistencies while students are submitting their rankings.
    </Callout>
  {:else}
    <Callout variant="warning" class="mb-4">
      <strong>Draft #{draftId}</strong> started last <strong>{startDate}</strong> at
      <strong>{startTime}</strong>. Changes on this page only affect the lab catalog and will not be
      reflected in the currently active draft.
    </Callout>
  {/if}
{/if}

<LabTable {labs} disabled={isRegistrationActive} />
