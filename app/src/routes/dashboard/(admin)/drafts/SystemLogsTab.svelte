<script lang="ts">
    import { fromUnixTime, getUnixTime } from 'date-fns';
    import type { ChoiceRecords } from 'drap-database';
    import { groupby } from 'itertools';

    // eslint-disable-next-line init-declarations
    export let records: ChoiceRecords;

    let showAutomated = false;

    $: events = Array.from(
        groupby(records, ({ created_at }) => getUnixTime(created_at)),
        ([timestamp, events]) => [timestamp, Array.from(events)] as const,
    ).filter(([_, [event]]) => event?.faculty_email !== null || showAutomated);
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
{#each events as [unix, choices]}
    {@const labs = [...new Set(choices.map(({ lab_id }) => lab_id))]}
    <div class="card my-2 space-y-4 p-2">
        <header class="card-header">
            <span class="h4">{fromUnixTime(unix).toLocaleString()}</span>
        </header>
        {#each labs as labId}
            {@const labChoices = choices.filter(({ lab_id: choiceLab }) => choiceLab === labId)}
            {@const [choice] = labChoices}
            {#if typeof choice !== 'undefined'}
                <div class="card bg-surface-500 space-y-1 p-4">
                    <strong class="uppercase">{labId}</strong> (Round {choice.round ?? 'Lottery'}):
                    {#if choice.faculty_email === null || choice.student_email === null}
                        {#if choice.faculty_email === null}
                            <!-- If the system auto-skipped, TODO: if due to quota or non-interest -->
                            <span>This selection was automated by the system</span>
                        {:else}
                            <!-- If a faculty member selected no students -->
                            <span
                                >This selection of <span class="variant-ghost-primary badge">no</span> students was
                                performed by faculty member
                                <span class="variant-ghost-secondary badge">{choice.faculty_email}</span></span
                            >
                        {/if}
                    {:else}
                        <!-- If a facutly member selected students -->
                        <span
                            >This selection of
                            {#each labChoices as { student_email }}
                                <span class="variant-ghost-primary badge">{student_email}</span>
                            {/each}
                            was performed by
                            <span class="variant-ghost-secondary badge">{choice.faculty_email}</span></span
                        >
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
{/each}
