<script lang="ts">
  import { fromUnixTime, getUnixTime } from 'date-fns';

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
    round: 'Lottery' | `Round ${number}`;
    choices: FacultyChoiceRecord[];
  }

  interface SystemLogEvent {
    key: string;
    unix: number;
    labs: SystemLogLabGroup[];
  }

  const events = $derived.by(() => {
    const groupedByUnix: SystemLogEvent[] = [];
    const eventByUnixKey: Record<string, SystemLogEvent> = {};
    const labByEventAndLabKey: Record<string, SystemLogLabGroup> = {};

    for (const choice of records) {
      if (choice.userEmail === null && !showAutomated) continue;

      const unix = getUnixTime(choice.createdAt);
      const unixKey = unix.toString();
      let event = eventByUnixKey[unixKey];
      if (typeof event === 'undefined') {
        event = { key: unixKey, unix, labs: [] };
        eventByUnixKey[unixKey] = event;
        groupedByUnix.push(event);
      }

      const roundToken = choice.round === null ? 'lottery' : choice.round.toString();
      const eventLabKey = `${unixKey}|${choice.labId}|${roundToken}`;
      let labGroup = labByEventAndLabKey[eventLabKey];
      if (typeof labGroup === 'undefined') {
        labGroup = {
          key: eventLabKey,
          labId: choice.labId,
          round: choice.round === null ? 'Lottery' : `Round ${choice.round}`,
          choices: [],
        };
        labByEventAndLabKey[eventLabKey] = labGroup;
        event.labs.push(labGroup);
      }

      labGroup.choices.push(choice);
    }

    return groupedByUnix;
  });
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
            <strong class="uppercase">{lab.labId}</strong> ({lab.round}):
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
