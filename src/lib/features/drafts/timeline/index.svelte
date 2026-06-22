<script lang="ts">
  import { format } from 'date-fns';

  import ExportCsvButton from '$lib/features/export/csv/index.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type {
    Draft,
    DraftAssignmentSummary,
    DraftLabQuotaSnapshot,
    DraftSummaryChartData,
    InterventionsAggregate,
    Lab,
    LotteryAggregate,
  } from '$lib/features/drafts/types';
  import { DraftPhase, getDraftPhase } from '$lib/features/drafts/phase';
  import { ExportCsvButtonVariant } from '$lib/features/export/csv/variant';

  import Step from './step.svelte';

  import InterventionsActive from './interventions/active.svelte';
  import LotteryCompleted from './lottery/completed.svelte';
  import RegistrationActive from './registration/active.svelte';
  import RegistrationClosed from './registration/closed.svelte';
  import RegistrationCompleted from './registration/completed.svelte';
  import RegularPhase from './regular/index.svelte';
  import StartForm from './registration/start-form.svelte';
  import SummaryPhase from './summary/index.svelte';

  interface TimelineData {
    date: Date;
    label: string;
    count: number;
  }

  interface Props {
    draftId: bigint;
    requestedAt: Date;
    draft: Draft;
    labs: Lab[];
    studentCount: number;
    snapshots: DraftLabQuotaSnapshot[];
    allowlistCount: number;
    lateRegistrantsCount: number;
    timelineData: TimelineData[];
    assignmentSummary: DraftAssignmentSummary;
    draftSummaryChartData: DraftSummaryChartData;
    interventionsAggregate: InterventionsAggregate;
    lotteryAggregate: LotteryAggregate;
  }

  const {
    draftId: rawDraftId,
    requestedAt,
    draft,
    labs,
    studentCount,
    snapshots,
    allowlistCount,
    lateRegistrantsCount,
    timelineData,
    assignmentSummary,
    draftSummaryChartData,
    interventionsAggregate,
    lotteryAggregate,
  }: Props = $props();
  const draftId = $derived(rawDraftId.toString());
  const draftYear = $derived(draft.activePeriodStart.getFullYear());

  // Determine current phase
  const currentPhase = $derived(getDraftPhase(draft));

  // Phase labels for display
  function getPhaseLabel(phase: DraftPhase) {
    switch (phase) {
      case DraftPhase.Registration:
      case DraftPhase.RegistrationClosed:
        return 'Registration';
      case DraftPhase.Regular:
        return `Round ${draft.currRound} of ${draft.maxRounds}` as const;
      case DraftPhase.Intervention:
        return 'Interventions';
      case DraftPhase.Review:
        return 'Review';
      case DraftPhase.Finalized:
        return 'Finalized';
      default:
        throw new Error('unreachable');
    }
  }

  // Status per phase
  const registrationStatus = $derived.by(() => {
    switch (currentPhase) {
      case DraftPhase.Registration:
      case DraftPhase.RegistrationClosed:
        return 'active';
      default:
        return 'completed';
    }
  });

  const regularStatus = $derived.by(() => {
    switch (currentPhase) {
      case DraftPhase.Regular:
        return 'active';
      case DraftPhase.Registration:
      case DraftPhase.RegistrationClosed:
        return 'pending';
      default:
        return 'completed';
    }
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <span>Draft {draftYear}</span>
        <Badge>{draft.maxRounds} Rounds</Badge>
      </h2>
      <p class="text-muted-foreground">
        Started {format(draft.activePeriodStart, 'PPP')} &middot; {getPhaseLabel(currentPhase)}
      </p>
    </div>
    <div class="flex flex-wrap gap-2 lg:justify-end">
      {#if currentPhase === DraftPhase.Registration || currentPhase === DraftPhase.RegistrationClosed}
        {#if studentCount > 0}
          <ExportCsvButton
            {draftId}
            {requestedAt}
            variant={ExportCsvButtonVariant.Students}
            size="default"
          />
          <RegisteredDraftees {draftId} variant="primary">
            {currentPhase === DraftPhase.Registration
              ? 'No students have registered yet.'
              : 'No students have registered for this draft.'}
          </RegisteredDraftees>
        {/if}
        <StartForm {draftId} />
      {:else}
        <ExportCsvButton {draftId} {requestedAt} variant={ExportCsvButtonVariant.Students} />
        <ExportCsvButton {draftId} {requestedAt} variant={ExportCsvButtonVariant.Results} />
        <ExportCsvButton {draftId} {requestedAt} variant={ExportCsvButtonVariant.SystemLogs} />
      {/if}
    </div>
  </div>
  <!-- Timeline (reverse chronological: newest at top) -->
  <div class="pl-1">
    {#if currentPhase !== DraftPhase.Registration && currentPhase !== DraftPhase.RegistrationClosed}
      {#if currentPhase !== DraftPhase.Regular}
        {#if currentPhase !== DraftPhase.Intervention}
          <Step title="Summary" status="active" collapsible={false}>
            {#snippet metadata()}
              {#if draft.activePeriodEnd !== null}
                <span class="text-sm text-muted-foreground"
                  >{format(draft.activePeriodEnd, 'PPP')}</span
                >
              {:else}
                <span class="text-sm text-muted-foreground">Pending Finalization</span>
              {/if}
            {/snippet}
            <SummaryPhase
              {draftId}
              {draft}
              totalStudents={studentCount}
              {assignmentSummary}
              {draftSummaryChartData}
              {lotteryAggregate}
              isReview={currentPhase === DraftPhase.Review}
            />
          </Step>
          {#if currentPhase === DraftPhase.Finalized}
            <Step title="Lottery" status="completed">
              <LotteryCompleted {draftId} {lotteryAggregate} />
            </Step>
          {/if}
        {/if}
        <Step
          title="Interventions"
          status={currentPhase === DraftPhase.Intervention ? 'active' : 'completed'}
          open={currentPhase === DraftPhase.Intervention}
        >
          <InterventionsActive
            {draftId}
            {labs}
            {snapshots}
            rows={interventionsAggregate.dumbbellRows}
            isHistorical={currentPhase !== DraftPhase.Intervention}
          />
        </Step>
      {/if}
      <Step
        title="Regular Rounds"
        status={regularStatus}
        open={currentPhase === DraftPhase.Regular}
      >
        {#snippet metadata()}
          <span class="text-sm text-muted-foreground">
            {draft.currRound === null
              ? draft.maxRounds
              : Math.min(draft.currRound, draft.maxRounds)} / {draft.maxRounds}
          </span>
        {/snippet}
        {#if draft.currRound !== null && draft.currRound > 0 && draft.currRound <= draft.maxRounds}
          <RegularPhase
            {draftId}
            {requestedAt}
            round={draft.currRound}
            {labs}
            {assignmentSummary}
            showUndrafted
          />
        {:else if currentPhase === DraftPhase.Intervention || currentPhase === DraftPhase.Review || currentPhase === DraftPhase.Finalized}
          <RegularPhase
            {draftId}
            {requestedAt}
            round={draft.maxRounds}
            {labs}
            {assignmentSummary}
            showUndrafted={false}
          />
        {/if}
      </Step>
    {/if}
    <Step
      title="Registration"
      status={registrationStatus}
      open={currentPhase === DraftPhase.Registration ||
        currentPhase === DraftPhase.RegistrationClosed}
      last
    >
      {#snippet metadata()}
        <span class="text-sm text-muted-foreground">
          {studentCount}
          {studentCount === 1 ? 'Student' : 'Students'}
        </span>
      {/snippet}
      {#if currentPhase === DraftPhase.Registration}
        <RegistrationActive {draftId} {studentCount} {snapshots} />
      {:else if currentPhase === DraftPhase.RegistrationClosed}
        <RegistrationClosed {draftId} {studentCount} {allowlistCount} {snapshots} />
      {:else}
        <RegistrationCompleted
          {draftId}
          {requestedAt}
          draftCreatedAt={draft.activePeriodStart}
          registrationClosedAt={draft.registrationClosedAt}
          startedAt={draft.startedAt}
          {timelineData}
          {studentCount}
          {lateRegistrantsCount}
        />
      {/if}
    </Step>
  </div>
</div>
