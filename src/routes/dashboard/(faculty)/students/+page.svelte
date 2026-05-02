<script lang="ts">
  import BanIcon from '@lucide/svelte/icons/ban';
  import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
  import Clock3Icon from '@lucide/svelte/icons/clock-3';
  import InfoIcon from '@lucide/svelte/icons/info';
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';
  import UserXIcon from '@lucide/svelte/icons/user-x';

  import Empty from '$lib/components/empty.svelte';
  import PreviousPicks from '$lib/features/faculty/previous-picks/index.svelte';
  import StatCards from '$lib/features/faculty/stat-cards/index.svelte';

  import RankingsForm from './rankings-form.svelte';

  const { data } = $props();
  const {
    draft: { id, currRound, maxRounds },
    info,
  } = $derived(data);
</script>

{#if typeof info === 'undefined'}
  <Empty media={{ icon: BanIcon, size: 'sm' }}>
    {#snippet title()}Lab Excluded from This Draft{/snippet}
    {#snippet description()}
      Your lab was not included in the current draft's lineup. Contact the draft administrators if
      you believe this is an error.
    {/snippet}
  </Empty>
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
    <Empty media={{ icon: Clock3Icon, size: 'sm' }}>
      {#snippet title()}Draft Under Review{/snippet}
      {#snippet description()}
        The draft is now in review. Lottery assignment has already run, and draft administrators are
        validating results before finalization.
      {/snippet}
    </Empty>
    {#if researchers.length > 0}
      <PreviousPicks {researchers} />
    {/if}
  {:else if currRound > maxRounds}
    <Empty media={{ icon: ShuffleIcon, size: 'sm' }}>
      {#snippet title()}Lottery Stage{/snippet}
      {#snippet description()}
        The draft is now in the lottery stage. Kindly contact the draft administrators on how to
        proceed.
      {/snippet}
    </Empty>
    {#if researchers.length > 0}
      <PreviousPicks {researchers} />
    {/if}
  {:else if currRound === 0}
    <Empty media={{ icon: InfoIcon, size: 'sm' }}>
      {#snippet title()}Registration Still Open{/snippet}
      {#snippet description()}
        Students are still registering for this draft. Kindly wait for the draft administrators to
        officially open the draft.
      {/snippet}
    </Empty>
  {:else}
    {@const currentRoundSelections =
      currRound === null ? [] : researchers.filter(({ round }) => round === currRound)}
    {@const currentRoundSelectionIds = currentRoundSelections.map(({ id }) => id)}
    <StatCards
      {quota}
      {remainingQuota}
      draftedCount={researchers.length}
      {submissionSource}
      {autoAcknowledgeReason}
    />
    {#if autoAcknowledgeReason === 'quota-exhausted'}
      <Empty media={{ icon: CircleSlashIcon, size: 'sm' }}>
        {#snippet title()}No Slots Remaining{/snippet}
        {#snippet description()}
          This lab has no more draft slots remaining for the rest of this draft. No action is
          required for the rest of this draft.
        {/snippet}
      </Empty>
      {#if researchers.length > 0}
        <PreviousPicks {researchers} />
      {/if}
    {:else if autoAcknowledgeReason === 'no-preferences'}
      <Empty media={{ icon: UserXIcon, size: 'sm' }}>
        {#snippet title()}No Student Preferences This Round{/snippet}
        {#snippet description()}
          No undrafted students have selected this lab in this round. No action is required until
          the next one.
        {/snippet}
      </Empty>
      {#if researchers.length > 0}
        <PreviousPicks {researchers} />
      {/if}
    {:else if students.length > 0}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        {#if researchers.length > 0}
          <PreviousPicks {researchers} />
        {/if}
        {#if submissionSource === 'faculty'}
          <RankingsForm
            draft={id}
            round={currRound}
            {students}
            remainingQuota={remainingQuota + currentRoundSelections.length}
            initialSelectedIds={currentRoundSelectionIds}
            hasExistingSubmission
          />
        {:else}
          <RankingsForm draft={id} round={currRound} {students} {remainingQuota} />
        {/if}
      </div>
    {/if}
  {/if}
{/if}
