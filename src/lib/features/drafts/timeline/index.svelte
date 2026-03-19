<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import { format } from 'date-fns';

  import { Button } from '$lib/components/ui/button';
  import type {
    Draft,
    DraftFinalizedBreakdown,
    DraftRegistrationAllowlistEntry,
    FacultyChoiceRecord,
    Lab,
    Student,
  } from '$lib/features/drafts/types';
  import { resolve } from '$app/paths';

  import Step, { type Status } from './step.svelte';

  import LotteryActive from './lottery/active.svelte';
  import LotteryCompleted from './lottery/completed.svelte';
  import RegistrationActive from './registration/active.svelte';
  import RegistrationClosed from './registration/closed.svelte';
  import RegistrationCompleted from './registration/completed.svelte';
  import RegularPhase from './regular/index.svelte';
  import SummaryPhase from './summary/index.svelte';

  type Phase =
    | 'registration'
    | 'registration-closed'
    | 'regular'
    | 'intervention'
    | 'review'
    | 'finalized';

  interface Props {
    draftId: bigint;
    draft: Draft;
    labs: Lab[];
    available: Student[];
    selected: Student[];
    records: FacultyChoiceRecord[];
    finalized: DraftFinalizedBreakdown;
    allowlist: DraftRegistrationAllowlistEntry[];
  }

  const { draftId, draft, labs, available, selected, records, finalized, allowlist }: Props =
    $props();

  const allStudents = $derived([...available, ...selected]);

  // Determine current phase
  const currentPhase = $derived.by(() => {
    if (draft.activePeriodEnd !== null) return 'finalized';
    if (draft.currRound === null) return 'review';
    if (draft.currRound === 0) {
      if (draft.registrationClosesAt <= new Date()) return 'registration-closed';

      return 'registration';
    }
    if (draft.currRound !== null && draft.currRound > draft.maxRounds) return 'intervention';
    return 'regular';
  });

  // Phase labels for display
  function getPhaseLabel(phase: Phase) {
    switch (phase) {
      case 'registration':
        return 'Registration';
      case 'registration-closed':
        return 'Registration';
      case 'regular':
        return `Round ${draft.currRound} of ${draft.maxRounds}` as const;
      case 'intervention':
        return 'Lottery';
      case 'review':
        return 'Review';
      case 'finalized':
        return 'Finalized';
      default:
        throw new Error('unreachable');
    }
  }

  // Status per phase
  const registrationStatus: Status = $derived.by(() => {
    switch (currentPhase) {
      case 'registration':
      case 'registration-closed':
        return 'active';
      default:
        return 'completed';
    }
  });

  const regularStatus: Status = $derived.by(() => {
    switch (currentPhase) {
      case 'regular':
        return 'active';
      case 'registration':
      case 'registration-closed':
        return 'pending';
      case 'intervention':
      case 'review':
      case 'finalized':
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  });

  const lotteryStatus: Status = $derived.by(() => {
    switch (currentPhase) {
      case 'registration':
      case 'registration-closed':
      case 'regular':
        return 'pending';
      case 'intervention':
        return 'active';
      case 'review':
      case 'finalized':
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  });

  const lotteryStepTitle = $derived(currentPhase === 'review' ? 'Review' : 'Lottery');
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Draft #{draftId.toString()}</h2>
      <p class="text-muted-foreground">
        Started {format(draft.activePeriodStart, 'PPP')} &middot; {getPhaseLabel(currentPhase)}
      </p>
    </div>
    {#if currentPhase !== 'registration' && currentPhase !== 'registration-closed'}
      <div class="flex gap-2">
        <Button
          href={resolve(`/dashboard/drafts/${draftId}/students.csv`)}
          download
          variant="outline"
          size="sm"
        >
          <ArrowUpFromLineIcon class="size-4" />
          <span>Student Ranks</span>
        </Button>
        <Button
          href={resolve(`/dashboard/drafts/${draftId}/results.csv`)}
          download
          variant="outline"
          size="sm"
        >
          <ArrowUpFromLineIcon class="size-4" />
          <span>Results</span>
        </Button>
      </div>
    {/if}
  </div>

  <!-- Timeline (reverse chronological: newest at top) -->
  <div class="pl-1">
    <!-- Summary (visible in review and finalized phases) -->
    {#if currentPhase === 'review' || currentPhase === 'finalized'}
      <Step title="Summary" status="active" collapsible={false}>
        {#snippet metadata()}
          {#if draft.activePeriodEnd !== null}
            <span class="text-muted-foreground text-sm">{format(draft.activePeriodEnd, 'PPP')}</span
            >
          {:else}
            <span class="text-muted-foreground text-sm">Pending Finalization</span>
          {/if}
        {/snippet}
        <SummaryPhase
          {draftId}
          {draft}
          students={allStudents}
          {labs}
          {finalized}
          isReview={currentPhase === 'review'}
        />
      </Step>
    {/if}

    <!-- Lottery -->
    {#if currentPhase === 'intervention' || currentPhase === 'review' || currentPhase === 'finalized'}
      <Step
        title={lotteryStepTitle}
        status={lotteryStatus}
        defaultOpen={currentPhase === 'intervention' || currentPhase === 'review'}
      >
        {#if currentPhase === 'intervention'}
          <LotteryActive {draftId} {labs} {available} {selected} snapshots={finalized.snapshots} />
        {:else}
          <LotteryCompleted
            {selected}
            lotteryDrafted={finalized.sections.lotteryDrafted}
            isReview={currentPhase === 'review'}
            {draftId}
          />
        {/if}
      </Step>
    {/if}

    <!-- Regular Rounds -->
    {#if currentPhase !== 'registration' && currentPhase !== 'registration-closed'}
      <Step title="Regular Rounds" status={regularStatus} defaultOpen={currentPhase === 'regular'}>
        {#snippet metadata()}
          <span class="text-muted-foreground text-sm">
            {draft.currRound === null
              ? draft.maxRounds
              : Math.min(draft.currRound, draft.maxRounds)} / {draft.maxRounds}
          </span>
        {/snippet}
        {#if draft.currRound !== null && draft.currRound > 0 && draft.currRound <= draft.maxRounds}
          <RegularPhase round={draft.currRound} {labs} {records} {available} {selected} />
        {:else if currentPhase === 'review' || currentPhase === 'finalized'}
          <RegularPhase round={draft.maxRounds} {labs} {records} {available} {selected} />
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
      defaultOpen={currentPhase === 'registration' || currentPhase === 'registration-closed'}
      last
    >
      {#snippet metadata()}
        <span class="text-muted-foreground text-sm">{allStudents.length} students</span>
      {/snippet}
      {#if currentPhase === 'registration'}
        <RegistrationActive {draftId} students={allStudents} snapshots={finalized.snapshots} />
      {:else if currentPhase === 'registration-closed'}
        <RegistrationClosed
          {draftId}
          students={allStudents}
          snapshots={finalized.snapshots}
          {allowlist}
        />
      {:else}
        <RegistrationCompleted students={allStudents} />
      {/if}
    </Step>
  </div>
</div>
