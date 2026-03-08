<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
  import Clock3Icon from '@lucide/svelte/icons/clock-3';
  import InfoIcon from '@lucide/svelte/icons/info';
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import { SvelteSet } from 'svelte/reactivity';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import * as Empty from '$lib/components/ui/empty';
  import * as Popover from '$lib/components/ui/popover';
  import * as Tabs from '$lib/components/ui/tabs';

  import RankingsForm from './rankings-form.svelte';

  const { data } = $props();
  const {
    draft: { id, currRound, maxRounds },
    students,
    researchers,
    lab: { quota },
    submissionSource,
    remainingQuota,
    autoAcknowledgeReason,
  } = $derived(data);

  const draftees = new SvelteSet<string>();

  const researchersByRound = $derived(Object.groupBy(researchers, r => r.round));

  const remainingTonal = $derived.by(() => {
    if (submissionSource === 'faculty') return 'preset-tonal-muted';
    switch (autoAcknowledgeReason) {
      case 'quota-exhausted':
        return 'preset-tonal-destructive';
      case 'no-preferences':
        return 'preset-tonal-muted';
      default:
        return remainingQuota > 0 ? 'preset-tonal-success' : 'preset-tonal-warning';
    }
  });
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
{:else}
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
    <Card.Root variant="soft" class="preset-tonal-muted">
      <Card.Header>
        <Card.Title class="flex items-center gap-1.5">
          Total Quota
          <Popover.Root>
            <Popover.Trigger>
              <CircleHelpIcon class="text-muted-foreground size-3.5" />
            </Popover.Trigger>
            <Popover.Content class="text-sm">
              Total slots allocated to your lab for this draft.
            </Popover.Content>
          </Popover.Root>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-2xl font-semibold tabular-nums">{quota}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft" class={remainingTonal}>
      <Card.Header>
        <Card.Title class="flex items-center gap-1.5">
          Remaining This Round
          <Popover.Root>
            <Popover.Trigger>
              <CircleHelpIcon class="text-muted-foreground size-3.5" />
            </Popover.Trigger>
            <Popover.Content class="text-sm">
              Slots you can still fill. You're not required to exhaust your allocation this round.
            </Popover.Content>
          </Popover.Root>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-2xl font-semibold tabular-nums">{remainingQuota}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft" class="preset-tonal-accent col-span-2 sm:col-span-1">
      <Card.Header>
        <Card.Title class="flex items-center gap-1.5">
          Drafted So Far
          <Popover.Root>
            <Popover.Trigger>
              <CircleHelpIcon class="text-muted-foreground size-3.5" />
            </Popover.Trigger>
            <Popover.Content class="text-sm">
              Students your lab selected in previous rounds.
            </Popover.Content>
          </Popover.Root>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-2xl font-semibold tabular-nums">{researchers.length}</p>
      </Card.Content>
    </Card.Root>
  </div>

  {#if submissionSource === 'faculty'}
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
          This lab has no more draft slots remaining for the rest of this draft. No action is
          required for the rest of this draft.
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
          No undrafted students have selected this lab in this round. No action is required until
          the next one.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else if students.length > 0}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
      {#if currRound > 1 && researchers.length > 0}
        <Card.Root variant="soft">
          <Card.Header>
            <Card.Title>Previous Picks</Card.Title>
          </Card.Header>
          <Card.Content>
            <Tabs.Root value={String(currRound - 1)}>
              <Tabs.List>
                {#each Object.keys(researchersByRound)
                  .map(Number)
                  .toSorted((a, b) => a - b) as round (round)}
                  <Tabs.Trigger value={String(round)}>Round {round}</Tabs.Trigger>
                {/each}
              </Tabs.List>
              {#each Object.entries(researchersByRound) as [round, students] (round)}
                <Tabs.Content value={round}>
                  <ul class="space-y-1">
                    {#each students ?? [] as { email, givenName, familyName, avatarUrl, studentNumber } (email)}
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
                </Tabs.Content>
              {/each}
            </Tabs.Root>
          </Card.Content>
        </Card.Root>
      {/if}
      <RankingsForm
        draft={id}
        {students}
        drafteeIds={draftees}
        disabled={remainingQuota - draftees.size < 0}
        {remainingQuota}
      />
    </div>
  {/if}
{/if}
