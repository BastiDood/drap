<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import { format, lightFormat } from 'date-fns';

  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
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
  import { resolve } from '$app/paths';

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
      case DraftPhase.Intervention:
      case DraftPhase.Review:
      case DraftPhase.Finalized:
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  });

  type InterventionsRenderedPhase =
    | DraftPhase.Intervention
    | DraftPhase.Review
    | DraftPhase.Finalized;
  type LotteryRenderedPhase = DraftPhase.Review | DraftPhase.Finalized;

  function interventionsStatusFor(phase: InterventionsRenderedPhase) {
    switch (phase) {
      case DraftPhase.Intervention:
        return 'active';
      case DraftPhase.Review:
      case DraftPhase.Finalized:
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  }

  function lotteryStatusFor(phase: LotteryRenderedPhase) {
    switch (phase) {
      case DraftPhase.Review:
        return 'active';
      case DraftPhase.Finalized:
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  }

  function lotteryStepTitleFor(phase: LotteryRenderedPhase) {
    return phase === DraftPhase.Review ? 'Review' : 'Lottery';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex w-full flex-col justify-between gap-2 lg:flex-row">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <span>Draft #{draftId.toString()}</span>
        <Badge>{draft.maxRounds} Rounds</Badge>
      </h2>
      <p class="text-muted-foreground">
        Started {format(draft.activePeriodStart, 'PPP')} &middot; {getPhaseLabel(currentPhase)}
      </p>
    </div>
<div class="flex flex-wrap items-start gap-2">
      {#if currentPhase === DraftPhase.Registration || currentPhase === DraftPhase.RegistrationClosed}
        <StartForm {draftId} />
      {/if}
      {#if currentPhase !== DraftPhase.Registration && currentPhase !== DraftPhase.RegistrationClosed}
        <div class="flex flex-wrap gap-2 *:w-full min-[24rem]:*:w-min">
          <Button
            href={resolve(`/dashboard/drafts/${draftId}/students.csv`)}
            download="{lightFormat(requestedAt, 'yyyy-MM-dd')}_{draftId}_students.csv"
            variant="outline"
            size="sm"
          >
            <ArrowUpFromLineIcon class="size-4" />
            <span>Student Ranks</span>
          </Button>
          <Button
            href={resolve(`/dashboard/drafts/${draftId}/results.csv`)}
            download="{lightFormat(requestedAt, 'yyyy-MM-dd')}_{draftId}_results.csv"
            variant="outline"
            size="sm"
          >
            <ArrowUpFromLineIcon class="size-4" />
            <span>Results</span>
          </Button>
          <Button
            href={resolve(`/dashboard/drafts/${draftId}/system-logs.csv`)}
            download="{lightFormat(requestedAt, 'yyyy-MM-dd')}_{draftId}_system-logs.csv"
            variant="outline"
            size="sm"
          >
            <ArrowUpFromLineIcon class="size-4" />
            <span>System Logs</span>
          </Button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Timeline (reverse chronological: newest at top) -->
  <div class="pl-1">
    <!-- Summary (visible in review and finalized phases) -->
    {#if currentPhase === DraftPhase.Review || currentPhase === DraftPhase.Finalized}
      <Step title="Summary" status="active" collapsible={false}>
        {#snippet metadata()}
          {#if draft.activePeriodEnd !== null}
            <span class="text-sm text-muted-foreground">{format(draft.activePeriodEnd, 'PPP')}</span
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
          isReview={currentPhase === DraftPhase.Review}
        />
      </Step>
    {/if}

    <!-- Lottery: post-intervention only (review + finalized) -->
    {#if currentPhase === DraftPhase.Review || currentPhase === DraftPhase.Finalized}
      <Step
        title={lotteryStepTitleFor(currentPhase)}
        status={lotteryStatusFor(currentPhase)}
        open={currentPhase === DraftPhase.Review}
      >
        <LotteryCompleted
          {draftId}
          isReview={currentPhase === DraftPhase.Review}
          {lotteryAggregate}
        />
      </Step>
    {/if}

    <!-- Interventions: active during intervention phase, historical after -->
    {#if currentPhase === DraftPhase.Intervention || currentPhase === DraftPhase.Review || currentPhase === DraftPhase.Finalized}
      <Step
        title="Interventions"
        status={interventionsStatusFor(currentPhase)}
        open={currentPhase === DraftPhase.Intervention}
      >
        <InterventionsActive
          {draftId}
          {labs}
          {snapshots}
          {interventionsAggregate}
          isHistorical={currentPhase !== DraftPhase.Intervention}
        />
      </Step>
    {/if}

    <!-- Regular Rounds -->
    {#if currentPhase !== DraftPhase.Registration && currentPhase !== DraftPhase.RegistrationClosed}
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
        {:else if currentPhase === DraftPhase.Review || currentPhase === DraftPhase.Finalized}
          <RegularPhase
            {draftId}
            {requestedAt}
            round={draft.maxRounds}
            {labs}
            {assignmentSummary}
            showUndrafted={false}
          />
        {:else}
          <p class="text-muted-foreground">
            Regular rounds have been completed. {draft.maxRounds} rounds were executed.
          </p>
        {/if}
      </Step>
    {/if}

    <!-- Registration (always at bottom) -->
    <Step
      title="Registration"
      status={registrationStatus}
      open={currentPhase === DraftPhase.Registration ||
        currentPhase === DraftPhase.RegistrationClosed}
      last
    >
      {#snippet metadata()}
        <span class="text-sm text-muted-foreground">{studentCount} students</span>
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
