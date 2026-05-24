<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';

  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import StatCardGroup from '$lib/features/drafts/timeline/stat-card-group.svelte';

  import RegistrantsChart from './registrants-chart.svelte';

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

<div class="space-y-4">
  <StatCardGroup columns="one">
    <StatCard icon={UsersIcon}>
      {#snippet title()}Registered Students{/snippet}
      {#snippet body()}
        <p id="stat-registered-students" class="text-2xl font-bold tabular-nums">
          {studentCount}
        </p>
      {/snippet}
      {#snippet subtitle()}
        {#if lateRegistrantsCount > 0}
          {lateRegistrantsCount} Late Registrants Included
        {:else}
          Final Registration Count
        {/if}
      {/snippet}
    </StatCard>
  </StatCardGroup>
  <RegistrantsChart
    {draftId}
    {draftCreatedAt}
    {registrationClosedAt}
    {startedAt}
    {requestedAt}
    {timelineData}
  />
</div>
