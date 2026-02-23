<script lang="ts">
  import { format } from 'date-fns';

  import Callout from '$lib/components/callout.svelte';
  import { LabTable } from '$lib/features/labs';

  const { data } = $props();
  const { draft, labs } = $derived(data);
</script>

{#if typeof draft !== 'undefined'}
  {@const { id: draftId, activePeriodStart } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <Callout variant="warning" class="mb-4">
    <strong>Draft #{draftId}</strong> started last <strong>{startDate}</strong> at
    <strong>{startTime}</strong>. Changes on this page only affect the lab catalog and will not be
    reflected in the currently active draft.
  </Callout>
{/if}

<LabTable {labs} />
