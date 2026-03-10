<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
  import Clock3Icon from '@lucide/svelte/icons/clock-3';
  import InfoIcon from '@lucide/svelte/icons/info';
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import { SvelteSet } from 'svelte/reactivity';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Empty from '$lib/components/ui/empty';
  import { getOrdinalSuffix } from '$lib/ordinal';

  import RankingsForm from './rankings-form.svelte';

  const { data } = $props();
  const {
    draft: { id, currRound, maxRounds },
    students,
    researchers,
    lab: { name, quota },
    submissionSource,
    remainingQuota,
    autoAcknowledgeReason,
  } = $derived(data);

  const draftees = new SvelteSet<string>();
  const remainingDraftees = $derived(remainingQuota - draftees.size);
</script>

{#if currRound === null}
  <Empty.Root>
    <Empty.Media variant="icon">
      <Clock3Icon class="text-muted-foreground size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>Draft Under Review</Empty.Title>
      <Empty.Description>
        The draft is now in review. Lottery assignment has already run, and draft administrators are
        validating results before finalization.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if currRound > maxRounds}
  <Empty.Root>
    <Empty.Media variant="icon">
      <ShuffleIcon class="text-muted-foreground size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>Lottery Stage</Empty.Title>
      <Empty.Description>
        The draft is now in the lottery stage. Kindly contact the draft administrators on how to
        proceed.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if currRound === 0}
  <Empty.Root>
    <Empty.Media variant="icon">
      <InfoIcon class="text-muted-foreground size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>Registration Still Open</Empty.Title>
      <Empty.Description>
        Students are still registering for this draft. Kindly wait for the draft administrators to
        officially open the draft.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if submissionSource === 'faculty'}
  <Empty.Root>
    <Empty.Media variant="icon">
      <CheckCircleIcon class="text-muted-foreground size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>Round Already Submitted</Empty.Title>
      <Empty.Description>
        This lab has already submitted its picks for this round. No action is required until the
        next one.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if autoAcknowledgeReason === 'quota-exhausted'}
  <Empty.Root>
    <Empty.Media variant="icon">
      <CircleSlashIcon class="text-muted-foreground size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>No Slots Remaining</Empty.Title>
      <Empty.Description>
        This lab has no more draft slots remaining for the rest of this draft. No action is required
        for the rest of this draft.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if autoAcknowledgeReason === 'no-preferences'}
  <Empty.Root>
    <Empty.Media variant="icon">
      <UserXIcon class="text-muted-foreground size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>No Student Preferences This Round</Empty.Title>
      <Empty.Description>
        No undrafted students have selected this lab in this round. No action is required until the
        next one.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if students.length > 0}
  {@const suffix = getOrdinalSuffix(currRound)}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
    <div class="prose dark:prose-invert">
      <h2>Draft Picks</h2>
      <p>
        Welcome to the draft! The <strong>{name}</strong> has been allocated
        <strong>{quota}</strong>
        slots in total. As a lab head, you may pick at most
        <strong>{Math.max(remainingDraftees, 0)}</strong>
        more students in this round. The following students have selected your lab as their
        <strong>{currRound}{suffix}</strong>
        choice. Simply click on the student's name to toggle the selection. By default, none are selected.
        Note that you <em>not</em> required to exhaust your entire allocation in this round. You may hold
        off on some of your slots for the next round.
      </p>
      <p>
        When ready, you may press the <strong>"Submit"</strong> button. Empty submissions are
        allowed. In any case, all lab heads must submit their picks before the next round
        <em>automatically</em> begins. All lab heads and administrators will be notified when this happens.
      </p>
    </div>
    <RankingsForm draft={id} {students} drafteeIds={draftees} disabled={remainingDraftees < 0} />
  </div>
{/if}
{#if researchers.length > 0}
  <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
    Drafted Students from Previous Rounds
  </h3>
  <nav class="space-y-1">
    <ul class="space-y-1">
      {#each researchers as { email, givenName, familyName, avatarUrl, studentNumber } (email)}
        <a
          href="mailto:{email}"
          class="bg-muted hover:bg-muted/80 flex items-center gap-3 rounded-md p-2 transition-colors duration-150"
        >
          <Avatar.Root class="size-10">
            <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
            <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
          </Avatar.Root>
          <div class="flex grow flex-col">
            <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
            {#if studentNumber !== null}
              <span class="text-sm opacity-50">{studentNumber}</span>
            {/if}
            <span class="text-xs opacity-50">{email}</span>
          </div>
        </a>
      {/each}
    </ul>
  </nav>
{/if}
