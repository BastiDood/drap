<script lang="ts">
  import { fromUnixTime, getUnixTime } from 'date-fns';

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
    round: 'Lottery' | `${number}`;
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
          round: choice.round === null ? 'Lottery' : `${choice.round}`,
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

<label class="mt-4 flex items-center space-x-2">
  <input
    class="h-4 w-4 rounded-lg border border-primary"
    type="checkbox"
    bind:checked={showAutomated}
  />
  <span>Show System Automation Logs</span>
</label>

<div class="my-4 overflow-auto rounded-lg border">
  <table class="w-full">
    <thead class="text-left">
      <tr class="border-b">
        <th class="py-2 px-4 whitespace-nowrap">Timestamp</th>
        <th class="py-2 px-4 whitespace-nowrap">Round</th>
        <th class="py-2 px-4 whitespace-nowrap">Lab ID</th>
        <th class="py-2 px-4 whitespace-nowrap">Action</th>
        <th class="py-2 px-4 whitespace-nowrap">Actor</th>
      </tr>
    </thead>

    <tbody>
      {#each events as event (event.key)}
        {#each event.labs as lab (lab.key)}
          {@const [choice] = lab.choices}

          {#if typeof choice !== 'undefined'}
            <tr class="border-t">
              <td class="py-2 px-4 whitespace-nowrap">{fromUnixTime(event.unix).toLocaleString()}</td>
              <td class="py-2 px-4 whitespace-nowrap">{lab.round}</td>
              <td class="py-2 px-4 whitespace-nowrap uppercase">{lab.labId}</td>
              <td class="py-2 px-4 whitespace-nowrap">
                {#if choice.userEmail === null}
                  <!-- If the system auto-skipped -->
                  <span>System automation</span>
                {:else if choice.studentEmail === null}
                  <!-- If a faculty member selected no students -->
                  <span>
                    <Badge variant="outline" class="border-primary bg-primary/10 text-primary dark:border-secondary dark:bg-secondary/10 dark:text-secondary"
                      >No</Badge
                    >
                    students selected
                  </span>
                {:else}
                  <!-- If a faculty member selected students -->
                  <span>
                    Selected
                    {#each lab.choices as { studentEmail } (studentEmail)}
                      <Badge variant="outline" class="border-primary bg-primary/10 text-primary dark:border-secondary dark:bg-secondary/10 dark:text-secondary"
                        >{studentEmail}</Badge
                      >
                    {/each}
                  </span>
                {/if}
              </td>
              <td class="py-2 px-4 whitespace-nowrap">
                {#if choice.userEmail === null}
                  <Badge
                    variant="outline"
                    class="border-secondary bg-secondary/10 text-secondary-foreground dark:text-secondary">System</Badge
                  >
                {:else}
                  <Badge
                    variant="outline"
                    class="border-secondary bg-secondary/10 text-secondary-foreground dark:text-secondary"
                    >{choice.userEmail}</Badge
                  >
                {/if}
              </td>
            </tr>
          {/if}
        {/each}
      {/each}
    </tbody>
  </table>
</div>
