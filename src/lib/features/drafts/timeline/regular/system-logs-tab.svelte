<script lang="ts">
  import { fromUnixTime, getUnixTime } from 'date-fns';
  import { groupBy } from 'itertools';

  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  import type { FacultyChoiceRecord } from '$lib/features/drafts/types';

  interface Props {
    records: FacultyChoiceRecord[];
  }

  const { records }: Props = $props();

  let showAutomated = $state(false);

  interface SystemLogLabGroup {
    key: string;
    labId: string;
    round: number | null;
    choices: FacultyChoiceRecord[];
  }

  interface SystemLogEvent {
    key: string;
    unix: number;
    labs: SystemLogLabGroup[];
  }

  const groupedRecords = $derived(groupBy(records, ({ createdAt }) => getUnixTime(createdAt)));
  const events = $derived(
    Object.entries(groupedRecords)
      .map(([unix, groupedChoices]) => {
        const visibleChoices = groupedChoices.filter(
          ({ userEmail }) => userEmail !== null || showAutomated,
        );
        if (visibleChoices.length === 0) return null;

        const labs = Object.entries(
          Object.groupBy(visibleChoices, choice => {
            const roundToken = choice.round === null ? 'lottery' : String(choice.round);
            return `${unix}|${choice.labId}|${roundToken}`;
          }),
        ).flatMap(([key, choices]) => {
          if (typeof choices === 'undefined' || choices.length === 0) return [];
          const [firstChoice] = choices;
          if (typeof firstChoice === 'undefined') return [];
          return [
            {
              key,
              labId: firstChoice.labId,
              round: firstChoice.round,
              choices,
            } as SystemLogLabGroup,
          ];
        });

        return {
          key: unix,
          unix: Number.parseInt(unix, 10),
          labs,
        } as SystemLogEvent;
      })
      .filter(event => event !== null),
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
{#each events as event (event.key)}
  <Card.Root class="my-2">
    <Card.Header>
      <Card.Title class="text-base">{fromUnixTime(event.unix).toLocaleString()}</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#each event.labs as lab (lab.key)}
        {@const [choice] = lab.choices}
        {#if typeof choice !== 'undefined'}
          <div class="bg-muted space-y-1 rounded-md p-4">
            <strong class="uppercase">{lab.labId}</strong> (Round {lab.round ?? 'Lottery'}):
            {#if choice.userEmail === null || choice.studentEmail === null}
              {#if choice.userEmail === null}
                <!-- If the system auto-skipped -->
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
              <!-- If a faculty member selected students -->
              <span>
                This selection of
                {#each lab.choices as { studentEmail } (studentEmail)}
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
