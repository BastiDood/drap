<script lang="ts">
  import { fromUnixTime, getUnixTime } from 'date-fns';
  import { groupby } from 'itertools';

  import * as Card from '$lib/components/ui/card';
  import { assert } from '$lib/assert';
  import { Badge } from '$lib/components/ui/badge';
  import type { schema } from '$lib/server/database';

  interface ChoiceRecord extends Pick<
    schema.FacultyChoice,
    'draftId' | 'round' | 'labId' | 'createdAt' | 'userId'
  > {
    userEmail: schema.User['email'] | null;
    studentEmail: schema.User['email'] | null;
  }

  interface Props {
    records: ChoiceRecord[];
  }

  const { records }: Props = $props();

  let showAutomated = $state(false);

  const events = $derived(
    Array.from(
      groupby(records, ({ createdAt }) => getUnixTime(createdAt)),
      ([timestamp, events]) =>
        [
          timestamp,
          Array.from(events.filter(({ userEmail }) => userEmail !== null || showAutomated)),
        ] as const,
      // this last filter is necessary to remove cases where an automation log does not coincide with a selection log
      // i.e. the start of the draft
    ).filter(([_, events]) => events.length > 0),
  );
</script>

<!--
@component

Take the records of all choices that have occurred and process them, deducing what exactly happened during each round
Needs to distinguish the following events (one 'event' being a grouping of choices that occurred at the same time):

1. Lab Head selected from among available students (generating a list of students) [non-null faculty email, non-null student emails]
2. Lab Head selected none of the available students [non-null faculty email, null student emails]
3. Lab received no quota, was auto-skipped [null faculty email, either met quota or no quota set]
4. Lab received no interest, was auto-skipped [null faculty email, none of the above cases]
-->

<Card.Root class="my-2">
  <Card.Content class="pt-4">
    <label class="flex items-center space-x-2">
      <input
        class="border-primary h-4 w-4 rounded border"
        type="checkbox"
        bind:checked={showAutomated}
      />
      <span>Show System Automation Logs</span>
    </label>
  </Card.Content>
</Card.Root>
{#each events as [unix, choices], index (index)}
  {@const labs = Array.from(
    choices.reduce((set, { labId, round }) => set.add(`${labId}|${round}`), new Set<string>()),
    key => {
      const [labId, round] = key.split('|');
      assert(typeof round !== 'undefined');
      assert(typeof labId !== 'undefined');
      return [labId, round.length === 0 ? null : Number.parseInt(round, 10)];
    },
  )}
  <Card.Root class="my-2">
    <Card.Header>
      <Card.Title class="text-base">{fromUnixTime(unix).toLocaleString()}</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#each labs as [labId, round] ([labId, round])}
        {@const labChoices = choices.filter(
          ({ labId: choiceLab, round: choiceRound }) =>
            choiceLab === labId && round === choiceRound,
        )}
        {@const [choice] = labChoices}
        {#if typeof choice !== 'undefined'}
          <div class="bg-muted space-y-1 rounded-md p-4">
            <strong class="uppercase">{labId}</strong> (Round {choice.round ?? 'Lottery'}):
            {#if choice.userEmail === null || choice.studentEmail === null}
              {#if choice.userEmail === null}
                <!-- If the system auto-skipped, TODO: if due to quota or non-interest -->
                <span>This selection was automated by the system</span>
              {:else}
                <!-- If a faculty member selected no students -->
                <span>
                  This selection of <Badge
                    variant="outline"
                    class="border-primary bg-primary/10 text-primary">no</Badge
                  >
                  students was performed by faculty member
                  <Badge
                    variant="outline"
                    class="border-secondary bg-secondary/10 text-secondary-foreground"
                    >{choice.userEmail}</Badge
                  >
                </span>
              {/if}
            {:else}
              <!-- If a facutly member selected students -->
              <span>
                This selection of
                {#each labChoices as { studentEmail } (studentEmail)}
                  <Badge variant="outline" class="border-primary bg-primary/10 text-primary"
                    >{studentEmail}</Badge
                  >
                {/each}
                was performed by
                <Badge
                  variant="outline"
                  class="border-secondary bg-secondary/10 text-secondary-foreground"
                  >{choice.userEmail}</Badge
                >
              </span>
            {/if}
          </div>
        {/if}
      {/each}
    </Card.Content>
  </Card.Root>
{/each}
