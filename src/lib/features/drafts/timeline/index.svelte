<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import { format } from 'date-fns';

  import { Button } from '$lib/components/ui/button';
  import type {
    Draft,
    DraftConcludedBreakdown,
    FacultyChoiceRecord,
    Lab,
    Student,
  } from '$lib/features/drafts/types';
  import { resolve } from '$app/paths';

  import Step, { type Status } from './step.svelte';

  import LotteryActive from './lottery/active.svelte';
  import LotteryCompleted from './lottery/completed.svelte';
  import RegistrationActive from './registration/active.svelte';
  import RegistrationCompleted from './registration/completed.svelte';
  import RegularPhase from './regular/index.svelte';
  import SummaryPhase from './summary/index.svelte';

  type Phase = 'registration' | 'regular' | 'lottery' | 'concluded';

  interface Props {
    draftId: bigint;
    draft: Draft;
    labs: Lab[];
    available: Student[];
    selected: Student[];
    records: FacultyChoiceRecord[];
    concluded: DraftConcludedBreakdown;
  }

  const { draftId, draft, labs, available, selected, records, concluded }: Props = $props();

  const allStudents = $derived([...available, ...selected]);

  // Determine current phase
  const currentPhase: Phase = $derived.by(() => {
    if (draft.activePeriodEnd !== null) return 'concluded';
    if (draft.currRound === null) return 'lottery';
    if (draft.currRound === 0) return 'registration';
    return 'regular';
  });

  // Phase labels for display
  function getPhaseLabel(phase: Phase): string {
    switch (phase) {
      case 'registration':
        return 'Registration';
      case 'regular':
        return `Round ${draft.currRound} of ${draft.maxRounds}`;
      case 'lottery':
        return 'Lottery';
      case 'concluded':
        return 'Concluded';
      default:
        return phase satisfies never;
    }
  }

  // Status per phase
  const registrationStatus: Status = $derived(
    currentPhase === 'registration' ? 'active' : 'completed',
  );

  const regularStatus: Status = $derived.by(() => {
    switch (currentPhase) {
      case 'regular':
        return 'active';
      case 'registration':
        return 'pending';
      case 'lottery':
      case 'concluded':
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  });

  const lotteryStatus: Status = $derived.by(() => {
    switch (currentPhase) {
      case 'registration':
      case 'regular':
        return 'pending';
      case 'lottery':
        return 'active';
      case 'concluded':
        return 'completed';
      default:
        throw new Error('unreachable');
    }
  });

  // Determine which phase is last in the visible timeline
  const isRegistrationLast = $derived(currentPhase === 'registration');
  const isRegularLast = $derived(currentPhase === 'regular');
  const isLotteryLast = $derived(currentPhase === 'lottery');
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
    {#if currentPhase !== 'registration'}
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
    <!-- Summary (only if concluded) - always at top when present -->
    {#if currentPhase === 'concluded' && draft.activePeriodEnd !== null}
      {@const concludedDate = draft.activePeriodEnd}
      <Step title="Summary" status="active" collapsible={false}>
        {#snippet metadata()}
          <span class="text-muted-foreground text-sm">{format(concludedDate, 'PPP')}</span>
        {/snippet}
        <SummaryPhase {draftId} {draft} students={allStudents} {labs} {concluded} />
      </Step>
    {/if}

    <!-- Lottery -->
    {#if currentPhase === 'lottery' || currentPhase === 'concluded'}
      <Step
        title="Lottery"
        status={lotteryStatus}
        defaultOpen={currentPhase === 'lottery'}
        last={isLotteryLast}
      >
        {#if currentPhase === 'lottery'}
          <LotteryActive {draftId} {labs} {available} {selected} snapshots={concluded.snapshots} />
        {:else}
          <LotteryCompleted {selected} lotteryDrafted={concluded.sections.lotteryDrafted} />
        {/if}
      </Step>
    {/if}

    <!-- Regular Rounds -->
    {#if currentPhase !== 'registration'}
      <Step
        title="Regular Rounds"
        status={regularStatus}
        defaultOpen={currentPhase === 'regular'}
        last={isRegularLast}
      >
        {#snippet metadata()}
          <span class="text-muted-foreground text-sm">
            {draft.currRound ?? draft.maxRounds} / {draft.maxRounds}
          </span>
        {/snippet}
        {#if draft.currRound !== null && draft.currRound > 0}
          <RegularPhase round={draft.currRound} {labs} {records} {available} {selected} />
        {:else if currentPhase === 'concluded'}
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
      defaultOpen={currentPhase === 'registration'}
      last={isRegistrationLast}
    >
      {#snippet metadata()}
        <span class="text-muted-foreground text-sm">{allStudents.length} students</span>
      {/snippet}
      {#if currentPhase === 'registration'}
        <RegistrationActive {draftId} students={allStudents} snapshots={concluded.snapshots} />
      {:else}
        <RegistrationCompleted students={allStudents} />
      {/if}
    </Step>
  </div>
</div>
