<script lang="ts">
    import { getUnixTime } from 'date-fns';
    import { FacultyChoice } from 'drap-model/faculty-choice';
    import { groupby } from 'itertools';

    export let data;

    let { choiceRecords, available, selected, draft } = data;

    /* Take the records of all choices that have occurred and process them, deducing what exactly happened during each round
     Needs to distinguish the following events (one 'event' being a grouping of choices that occurred at the same time):
      1. Lab Head selected from among available students (generating a list of students) [non-null faculty email, non-null student emails]
      2. Lab Head selected none of the available students [non-null faculty email, null student emails]
      3. Lab received no quota, was auto-skipped [null faculty email, either met quota or no quota set]
      4. Lab received no interest, was auto-skipped [null faculty email, none of the above cases]
    */

    $: events = Array.from(
        groupby(choiceRecords, ({ created_at }) => getUnixTime(created_at)),
        ([timestamp, events]) => [timestamp, Array.from(events)] as const,
    );
</script>

{#each events as [unix, choices]}
    <div>{unix}</div>
    {@const labs = [...new Set(choices.map( ({ lab_id }) => lab_id ))]}
    {#each labs as lab_id}
        <p>{lab_id}</p>
        {@const lab_choices = choices.filter( ({ lab_id: choice_lab }) => choice_lab == lab_id )}
        {#if lab_choices.length == 1 && (lab_choices[0]?.faculty_email == null || lab_choices[0]?.student_email == null)}
            {#if lab_choices[0]?.faculty_email == null}
                <!-- If the system auto-skipped, TBD if due to quota or non-interest -->
                <p>This selection was automated by the system</p>
            {:else}
                <!-- If a faculty member selected no students -->
                <p>This selection of no students was performed by {lab_choices[0]?.faculty_email}</p>
            {/if}
        {:else}
            <!-- If a facutly member selected students -->
            <p>This selection of {lab_choices.length} student/s was performed by {lab_choices[0]?.faculty_email}</p>    
        {/if}
    {/each}
{/each}