<script lang="ts">
  import AssignedStatsChart from '$lib/features/drafts/stats/assigned-stats-chart.svelte';
  import { buildAssignedStatsChart } from '$lib/features/drafts/stats/chart-data';
  import { DraftTable, InitDialog } from '$lib/features/drafts';

  const { data } = $props();
  const { drafts, draftStatsRecords } = $derived(data);
  const [latestDraft] = $derived(drafts);
  const assignedStatsChart = $derived(buildAssignedStatsChart(draftStatsRecords));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Drafts</h2>
      <p class="text-muted-foreground">Manage all draft sessions</p>
    </div>
    {#if typeof latestDraft === 'undefined' || latestDraft.activePeriodEnd !== null}
      <!-- There should only ever be one active draft at a time. -->
      <InitDialog />
    {/if}
  </div>
  <AssignedStatsChart chart={assignedStatsChart} />
  <DraftTable {drafts} />
</div>
