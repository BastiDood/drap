<script lang="ts">
  import RegistrantsChart from './registrants-chart.svelte';

  import DrafteesSheet from './draftees-sheet/index.svelte';

  interface TimelineData {
    date: Date;
    label: string;
    count: number;
  }

  interface Props {
    draftId: string;
    draftCreatedAt: Date;
    registrationClosedAt: Date;
    startedAt: Date | null;
    requestedAt: Date;
    timelineData: TimelineData[];
    studentCount: number;
    lateRegistrantsCount: number;
  }

  const {
    draftId,
    draftCreatedAt,
    registrationClosedAt,
    startedAt,
    requestedAt,
    timelineData,
    studentCount,
    lateRegistrantsCount,
  }: Props = $props();
</script>

<div class="space-y-6">
  <div class="prose dark:prose-invert">
    <p>
      <strong>{studentCount}</strong> students registered for this draft.
    </p>
    {#if lateRegistrantsCount > 0}
      <p>
        <strong>{lateRegistrantsCount}</strong> students registered after registration closed.
      </p>
    {/if}
  </div>
  <RegistrantsChart
    {draftCreatedAt}
    {registrationClosedAt}
    {startedAt}
    {requestedAt}
    {timelineData}
  />
  <div class="flex justify-end">
    <DrafteesSheet {draftId} />
  </div>
</div>
