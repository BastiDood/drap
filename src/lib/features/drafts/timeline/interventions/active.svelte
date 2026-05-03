<script lang="ts">
  import ConcludeForm from '$lib/features/drafts/timeline/lottery/conclude-form.svelte';
  import type {
    DraftLabQuotaSnapshot,
    InterventionsAggregate,
    Lab,
  } from '$lib/features/drafts/types';

  import QuotaDumbbellChart from './quota-dumbbell-chart.svelte';
  import StatCards from './stat-cards.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftLabQuotaSnapshot[];
    interventionsAggregate: InterventionsAggregate;
    isHistorical: boolean;
  }

  const { draftId, labs, snapshots, interventionsAggregate, isHistorical }: Props = $props();
</script>

<div class="@container space-y-4">
  <StatCards data={interventionsAggregate.statCards} {isHistorical} />
  <QuotaDumbbellChart {draftId} {labs} {snapshots} rows={interventionsAggregate.dumbbellRows} />
  {#if !isHistorical}
    <!-- New action buttons will go here -->
    <ConcludeForm {draftId} />
  {/if}
</div>
