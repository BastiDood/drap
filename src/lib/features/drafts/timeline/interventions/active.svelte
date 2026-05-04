<script lang="ts">
  import ConcludeForm from '$lib/features/drafts/timeline/lottery/conclude-form.svelte';
  import type { DraftLabQuotaSnapshot, DumbbellRow, Lab } from '$lib/features/drafts/types';

  import QuotaDumbbellChart from './quota-dumbbell-chart.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftLabQuotaSnapshot[];
    rows: DumbbellRow[];
    isHistorical: boolean;
  }

  const { draftId, labs, snapshots, rows, isHistorical }: Props = $props();
</script>

<div class="@container space-y-4">
  <QuotaDumbbellChart {draftId} {labs} {snapshots} {rows} {isHistorical} />
  {#if !isHistorical}
    <ConcludeForm {draftId} />
  {/if}
</div>
