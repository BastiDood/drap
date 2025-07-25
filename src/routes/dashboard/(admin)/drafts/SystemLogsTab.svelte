<script lang="ts">
  import { fromUnixTime, getUnixTime } from 'date-fns';
  import { groupby } from 'itertools';
  import type { schema } from '$lib/server/database';
  
  interface ChoiceRecord
    extends Pick<schema.FacultyChoice, 'draftId' | 'round' | 'labId' | 'createdAt' | 'userId'> {
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
      ([timestamp, events]) => [timestamp, Array.from(events)] as const,
    ).filter(([_, [event]]) => event?.userEmail !== null || showAutomated),
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

<div class="card my-2 space-y-2 p-2">
  <label class="flex items-center space-x-2">
    <input class="checkbox" type="checkbox" bind:checked={showAutomated} />
    <p>Show System Automation Logs</p>
  </label>
</div>
{#each events as [unix, choices], index (index)}
  {@const labs = Array.from(
    choices.reduce((set, { labId, round }) => set.add(`${labId}|${round}`), new Set<string>()),
    (key) => {
      const [labId, round] = key.split('|');
      // rather weird logic on this, i'll admit
      return [labId, round === null ? null : parseInt(round ?? "0", 10)];
    }
  )}
  <div class="card my-2 space-y-4 p-2">
    <header class="card-header">
      <span class="h4">{fromUnixTime(unix).toLocaleString()}</span>
    </header>
    {#each labs as [labId, round]}
      {@debug labs}
      {@const labChoices = choices.filter(({ labId: choiceLab, round: choiceRound }) => choiceLab === labId && round === choiceRound)}
      {@const [choice] = labChoices}
      {#if typeof choice !== 'undefined'}
        <div class="card bg-surface-500 space-y-1 p-4">
          <strong class="uppercase">{labId}</strong> (Round {choice.round ?? 'Lottery'}):
          {#if choice.userEmail === null || choice.studentEmail === null}
            {#if choice.userEmail === null}
              <!-- If the system auto-skipped, TODO: if due to quota or non-interest -->
              <span>This selection was automated by the system</span>
            {:else}
              <!-- If a faculty member selected no students -->
              <span
                >This selection of <span
                  class="preset-tonal-primary border-primary-500 badge border">no</span
                >
                students was performed by faculty member
                <span class="preset-tonal-secondary border-secondary-500 badge border"
                  >{choice.userEmail}</span
                ></span
              >
            {/if}
          {:else}
            <!-- If a facutly member selected students -->
            <span
              >This selection of
              {#each labChoices as { studentEmail } (studentEmail)}
                <span class="preset-tonal-primary border-primary-500 badge border"
                  >{studentEmail}</span
                >
              {/each}
              was performed by
              <span class="preset-tonal-secondary border-secondary-500 badge border"
                >{choice.userEmail}</span
              ></span
            >
          {/if}
        </div>
      {/if}
    {/each}
  </div>
{/each}
