<script lang="ts">
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Alert from '$lib/components/ui/alert';
  import DraftAssignments from '$lib/features/drafts/assignments/index.svelte';
  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import type {
    Draft,
    DraftAssignmentSummary,
    DraftSummaryChartData,
  } from '$lib/features/drafts/types';

  import DraftRoundsChart from './draft-rounds-chart.svelte';
  import LabDistributionChart from './lab-distribution-chart.svelte';
  import PreferenceAlignmentChart from './preference-alignment-chart.svelte';
  import SupplyDemandChart from './supply-demand-chart.svelte';

  interface Props {
    draftId: string;
    draft: Pick<Draft, 'maxRounds'>;
    totalStudents: number;
    assignmentSummary: DraftAssignmentSummary;
    draftSummaryChartData: DraftSummaryChartData;
    isReview: boolean;
  }

  const {
    draftId,
    draft,
    totalStudents,
    assignmentSummary,
    draftSummaryChartData,
    isReview,
  }: Props = $props();
</script>

<div class="@container space-y-4">
  {#if isReview}
    <Alert.Root variant="warning">
      <SparklesIcon class="text-accent" />
      <Alert.Title>Draft Review</Alert.Title>
      <Alert.Description>
        Lottery assignments are complete. Review results below before finalizing.
      </Alert.Description>
    </Alert.Root>
  {:else}
    <Alert.Root variant="success" class="grid-cols-[auto_1fr_auto] items-center gap-x-3">
      <CheckCircle2Icon class="text-success" />
      <Alert.Title>Draft Finalized</Alert.Title>
      <Alert.Description>
        This draft has been completed. All students have been assigned to their respective labs.
      </Alert.Description>
      <div class="col-start-2 mt-2 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0">
        <DraftAssignments {draftId} maxRounds={draft.maxRounds} />
      </div>
    </Alert.Root>
  {/if}
  <div class="grid w-fit grid-cols-1 gap-2 sm:grid-cols-[repeat(2,minmax(10rem,14rem))]">
    <StatCard icon={UsersIcon}>
      {#snippet title()}Total Students{/snippet}
      {#snippet body()}
        <p id="stat-total-students" class="text-2xl font-bold tabular-nums">{totalStudents}</p>
      {/snippet}
      {#snippet subtitle()}All Registered Participants{/snippet}
    </StatCard>
    <StatCard icon={FlaskConicalIcon}>
      {#snippet title()}Participating Labs{/snippet}
      {#snippet body()}
        <p id="stat-participating-labs" class="text-2xl font-bold tabular-nums">
          {assignmentSummary.metrics.participatingLabCount}
        </p>
      {/snippet}
      {#snippet subtitle()}Active Labs in Draft{/snippet}
    </StatCard>
  </div>
  <div class="space-y-4">
    <DraftRoundsChart chart={assignmentSummary.chart} />
    <SupplyDemandChart data={draftSummaryChartData.supplyVsDemand} />
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LabDistributionChart data={draftSummaryChartData.labDistribution} />
      <PreferenceAlignmentChart data={draftSummaryChartData.preferenceAlignment} />
    </div>
  </div>
</div>
