<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import { format } from 'date-fns';

  import * as Card from '$lib/components/ui/card';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';

  import type { Draft, FacultyChoiceRecord, Lab, Student } from './types';

  import LotteryPhase from './lottery/index.svelte';
  import RegistrationPhase from './registration/index.svelte';
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
  }

  const { draftId, draft, labs, available, selected, records }: Props = $props();

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

  // Track which sections are open - always include current phase
  let openSections = $state<string[]>([]);

  // Ensure current phase is always open when it changes
  $effect(() => {
    if (!openSections.includes(currentPhase)) openSections = [...openSections, currentPhase];
  });
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

  <!-- Timeline Accordion -->
  <div class="space-y-2">
    <!-- Summary Phase (only if concluded) -->
    {#if currentPhase === 'concluded' && draft.activePeriodEnd !== null}
      <Collapsible.Root
        open={openSections.includes('summary')}
        onOpenChange={open => {
          if (open) openSections = [...openSections, 'summary'];
          else openSections = openSections.filter(s => s !== 'summary');
        }}
      >
        <Card.Root>
          <Collapsible.Trigger class="w-full">
            <Card.Header class="hover:bg-muted/50 cursor-pointer">
              <Card.Title class="flex items-center justify-between">
                <span>Summary</span>
                <span class="text-muted-foreground text-sm font-normal">
                  {format(draft.activePeriodEnd, 'PPP')}
                </span>
              </Card.Title>
            </Card.Header>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Card.Content>
              <SummaryPhase {draftId} {draft} students={allStudents} {labs} />
            </Card.Content>
          </Collapsible.Content>
        </Card.Root>
      </Collapsible.Root>
    {/if}

    <!-- Lottery Phase -->
    {#if currentPhase === 'lottery' || currentPhase === 'concluded'}
      <Collapsible.Root
        open={openSections.includes('lottery')}
        onOpenChange={open => {
          if (open) openSections = [...openSections, 'lottery'];
          else openSections = openSections.filter(s => s !== 'lottery');
        }}
      >
        <Card.Root class={currentPhase === 'lottery' ? 'border-primary' : ''}>
          <Collapsible.Trigger class="w-full">
            <Card.Header class="hover:bg-muted/50 cursor-pointer">
              <Card.Title class="flex items-center justify-between">
                <span>Lottery Phase</span>
                {#if currentPhase === 'lottery'}
                  <span class="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    Active
                  </span>
                {/if}
              </Card.Title>
            </Card.Header>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Card.Content>
              <LotteryPhase
                {draftId}
                {labs}
                {available}
                {selected}
                isActive={currentPhase === 'lottery'}
              />
            </Card.Content>
          </Collapsible.Content>
        </Card.Root>
      </Collapsible.Root>
    {/if}

    <!-- Regular Rounds (show current round if active, or all rounds if past lottery) -->
    {#if currentPhase === 'regular' || currentPhase === 'lottery' || currentPhase === 'concluded'}
      <Collapsible.Root
        open={openSections.includes('regular')}
        onOpenChange={open => {
          if (open) openSections = [...openSections, 'regular'];
          else openSections = openSections.filter(s => s !== 'regular');
        }}
      >
        <Card.Root class={currentPhase === 'regular' ? 'border-primary' : ''}>
          <Collapsible.Trigger class="w-full">
            <Card.Header class="hover:bg-muted/50 cursor-pointer">
              <Card.Title class="flex items-center justify-between">
                <span>
                  {#if currentPhase === 'regular' && draft.currRound !== null}
                    Round {draft.currRound} of {draft.maxRounds}
                  {:else}
                    Regular Rounds (1-{draft.maxRounds})
                  {/if}
                </span>
                {#if currentPhase === 'regular'}
                  <span class="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    Active
                  </span>
                {/if}
              </Card.Title>
            </Card.Header>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Card.Content>
              {#if draft.currRound !== null && draft.currRound > 0}
                <RegularPhase round={draft.currRound} {labs} {records} {available} {selected} />
              {:else}
                <p class="text-muted-foreground">
                  Regular rounds have been completed. {draft.maxRounds} rounds were executed.
                </p>
              {/if}
            </Card.Content>
          </Collapsible.Content>
        </Card.Root>
      </Collapsible.Root>
    {/if}

    <!-- Lab Allocation Snapshot -->
    <Collapsible.Root
      open={openSections.includes('labs')}
      onOpenChange={open => {
        if (open) openSections = [...openSections, 'labs'];
        else openSections = openSections.filter(s => s !== 'labs');
      }}
    >
      <Card.Root>
        <Collapsible.Trigger class="w-full">
          <Card.Header class="hover:bg-muted/50 cursor-pointer">
            <Card.Title>Lab Allocation</Card.Title>
          </Card.Header>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Card.Content>
            <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {#each labs as lab (lab.id)}
                {@const labStudents = allStudents.filter(s => s.labId === lab.id)}
                <Card.Root class="bg-muted/30">
                  <Card.Header class="pb-2">
                    <Card.Title class="text-base">{lab.name}</Card.Title>
                    <Card.Description>
                      {labStudents.length} / {lab.quota} slots filled
                    </Card.Description>
                  </Card.Header>
                </Card.Root>
              {/each}
            </div>
          </Card.Content>
        </Collapsible.Content>
      </Card.Root>
    </Collapsible.Root>

    <!-- Registration Phase -->
    <Collapsible.Root
      open={openSections.includes('registration')}
      onOpenChange={open => {
        if (open) openSections = [...openSections, 'registration'];
        else openSections = openSections.filter(s => s !== 'registration');
      }}
    >
      <Card.Root class={currentPhase === 'registration' ? 'border-primary' : ''}>
        <Collapsible.Trigger class="w-full">
          <Card.Header class="hover:bg-muted/50 cursor-pointer">
            <Card.Title class="flex items-center justify-between">
              <span>Registration Phase</span>
              <span class="text-muted-foreground text-sm font-normal">
                {allStudents.length} students
              </span>
              {#if currentPhase === 'registration'}
                <span class="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  Active
                </span>
              {/if}
            </Card.Title>
          </Card.Header>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Card.Content>
            <RegistrationPhase
              {draftId}
              students={allStudents}
              isActive={currentPhase === 'registration'}
            />
          </Card.Content>
        </Collapsible.Content>
      </Card.Root>
    </Collapsible.Root>
  </div>
</div>
