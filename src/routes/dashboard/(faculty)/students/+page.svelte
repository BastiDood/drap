<script lang="ts">
  import BanIcon from '@lucide/svelte/icons/ban';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
  import Clock3Icon from '@lucide/svelte/icons/clock-3';
  import InfoIcon from '@lucide/svelte/icons/info';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';
  import UserXIcon from '@lucide/svelte/icons/user-x';

  import * as Dialog from '$lib/components/ui/dialog';
  import * as Empty from '$lib/components/ui/empty';
  import PreviousPicks from '$lib/features/faculty/previous-picks/index.svelte';
  import StatCards from '$lib/features/faculty/stat-cards/index.svelte';
  import { Button } from '$lib/components/ui/button';

  import RankingsForm from './rankings-form.svelte';

  const { data } = $props();
  const {
    draft: { id, currRound, maxRounds },
    info,
  } = $derived(data);
  let editDialogOpen = $state(false);
</script>

{#if typeof info === 'undefined'}
  <Empty.Root>
    <Empty.Media variant="icon">
      <BanIcon class="size-5 text-muted-foreground" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>Lab Excluded from This Draft</Empty.Title>
      <Empty.Description>
        Your lab was not included in the current draft's lineup. Contact the draft administrators if
        you believe this is an error.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else}
  {@const {
    students,
    researchers,
    lab: { quota },
    submissionSource,
    remainingQuota,
    autoAcknowledgeReason,
  } = info}
  {#if currRound === null}
    <Empty.Root>
      <Empty.Media variant="icon">
        <Clock3Icon class="size-5 text-muted-foreground" />
      </Empty.Media>
      <Empty.Header>
        <Empty.Title>Draft Under Review</Empty.Title>
        <Empty.Description>
          The draft is now in review. Lottery assignment has already run, and draft administrators
          are validating results before finalization.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
    {#if researchers.length > 0}
      <PreviousPicks {researchers} />
    {/if}
  {:else if currRound > maxRounds}
    <Empty.Root>
      <Empty.Media variant="icon">
        <ShuffleIcon class="size-5 text-muted-foreground" />
      </Empty.Media>
      <Empty.Header>
        <Empty.Title>Lottery Stage</Empty.Title>
        <Empty.Description>
          The draft is now in the lottery stage. Kindly contact the draft administrators on how to
          proceed.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
    {#if researchers.length > 0}
      <PreviousPicks {researchers} />
    {/if}
  {:else if currRound === 0}
    <Empty.Root>
      <Empty.Media variant="icon">
        <InfoIcon class="size-5 text-muted-foreground" />
      </Empty.Media>
      <Empty.Header>
        <Empty.Title>Registration Still Open</Empty.Title>
        <Empty.Description>
          Students are still registering for this draft. Kindly wait for the draft administrators to
          officially open the draft.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <StatCards
      {quota}
      {remainingQuota}
      draftedCount={researchers.length}
      {submissionSource}
      {autoAcknowledgeReason}
    />
    {@const currentRoundSelections =
      currRound === null ? [] : researchers.filter(({ round }) => round === currRound)}
    {@const currentRoundSelectionIds = currentRoundSelections.map(({ id }) => id)}
    {#if submissionSource === 'faculty'}
      <Empty.Root>
        <Empty.Media variant="icon">
          <CheckCircleIcon class="size-5 text-muted-foreground" />
        </Empty.Media>
        <Empty.Header>
          <Empty.Title>Round Already Submitted</Empty.Title>
          <Empty.Description>
            This lab has already submitted its picks for this round. You may still edit while this
            round is active. Once all labs submit and the round advances, changes are irreversible.
          </Empty.Description>
        </Empty.Header>
        <Empty.Content>
          <Button onclick={() => (editDialogOpen = true)}>
            <PencilIcon />
            Edit Selection
          </Button>
        </Empty.Content>
      </Empty.Root>
      {#if researchers.length > 0}
        <PreviousPicks {researchers} />
      {/if}
      <Dialog.Root bind:open={editDialogOpen}>
        <Dialog.Content class="max-h-[85vh] max-w-2xl overflow-y-auto">
          <Dialog.Header>
            <Dialog.Title>Edit Round {currRound} Selection</Dialog.Title>
            <Dialog.Description>
              Modify your student selections for this round. Changes will overwrite your previous
              submission.
            </Dialog.Description>
          </Dialog.Header>
          <RankingsForm
            draft={id}
            round={currRound}
            {students}
            remainingQuota={remainingQuota + currentRoundSelections.length}
            initialSelectedIds={currentRoundSelectionIds}
            submitLabel="Save Changes"
            onCancel={() => (editDialogOpen = false)}
            onSuccess={() => (editDialogOpen = false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    {:else if autoAcknowledgeReason === 'quota-exhausted'}
      <Empty.Root>
        <Empty.Media variant="icon">
          <CircleSlashIcon class="size-5 text-muted-foreground" />
        </Empty.Media>
        <Empty.Header>
          <Empty.Title>No Slots Remaining</Empty.Title>
          <Empty.Description>
            This lab has no more draft slots remaining for the rest of this draft. No action is
            required for the rest of this draft.
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
      {#if researchers.length > 0}
        <PreviousPicks {researchers} />
      {/if}
    {:else if autoAcknowledgeReason === 'no-preferences'}
      <Empty.Root>
        <Empty.Media variant="icon">
          <UserXIcon class="size-5 text-muted-foreground" />
        </Empty.Media>
        <Empty.Header>
          <Empty.Title>No Student Preferences This Round</Empty.Title>
          <Empty.Description>
            No undrafted students have selected this lab in this round. No action is required until
            the next one.
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
      {#if researchers.length > 0}
        <PreviousPicks {researchers} />
      {/if}
    {:else if students.length > 0}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        {#if researchers.length > 0}
          <PreviousPicks {researchers} />
        {/if}
        <RankingsForm draft={id} round={currRound} {students} {remainingQuota} />
      </div>
    {/if}
  {/if}
{/if}
