<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import { LabTable } from '$lib/features/labs';

  const { data } = $props();
  const { draft, labs } = $derived(data);
</script>

{#if typeof draft !== 'undefined' && draft.currRound !== null && draft.currRound > 0}
  {@const { id: draftId, activePeriodStart, currRound, maxRounds } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <Alert.Root variant="warning" class="mb-4">
    <TriangleAlertIcon />
    <Alert.Description>
      <strong>Draft #{draftId}</strong> started last <strong>{startDate}</strong> at
      <strong>{startTime}</strong> and is now in Round <strong>{currRound}</strong> of
      <strong>{maxRounds}</strong>. Lab quotas are read-only while a draft is in progress.
    </Alert.Description>
  </Alert.Root>
  <LabTable {labs} hasActiveDraft />
{:else}
  <LabTable {labs} hasActiveDraft={false} />
{/if}
