<script>
    import { assert } from '$lib/assert';
    import Student from '$lib/users/Student.svelte';
    
    import ConcludeForm from './ConcludeForm.svelte';
    import InterveneForm from './InterveneForm.svelte';
    
    // eslint-disable-next-line init-declarations
    export let data;
    const { draft, available, labs, selected } = data;

    assert(available && draft)

</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
    <div class="prose dark:prose-invert">
        <h3>Lottery</h3>
        <p>
            Draft &num;{draft.draft_id} is almost done! The final stage is the lottery phase, where the remaining undrafted
            students are randomly assigned to their labs. Before the system automatically randomizes anything, administrators
            are given a final chance to manually intervene with the draft results.
        </p>
        <ul>
            <li>
                The <strong>"Eligible for Lottery"</strong> section features a list of the remaining undrafted students.
                Administrators may negotiate with the lab heads on how to manually assign and distribute these students
                fairly among interested labs.
            </li>
            <li>
                Meanwhile, the <strong>"Already Drafted"</strong> section features an <em>immutable</em> list of
                students who have already been drafted into their respective labs. These are considered final.
            </li>
        </ul>
        <p>
            <!-- TODO: Add reminder about resetting the lab quota. -->
            When ready, administrators can press the <strong>"Conclude Draft"</strong> button to proceed with the
            randomization stage. The list of students will be randomly shuffled and distributed among the labs in
            a round-robin fashion. To uphold fairness, it is important that uneven distributions are manually resolved
            beforehand.
        </p>
        <p>
            After the randomization stage, the draft process is officially complete. All students, lab heads,
            and administrators are notified of the final results.
        </p>
        <ConcludeForm draft={draft.draft_id} />
    </div>
    <div class="min-w-max space-y-2">
        <nav class="card list-nav variant-ghost-warning space-y-4 p-4">
            <h3 class="h3">Eligible for Lottery ({available.length})</h3>
            {#if available.length > 0}
                <InterveneForm draft={draft.draft_id} {labs} students={available} />
            {:else}
                <p class="prose max-w-none dark:prose-invert">
                    Congratulations! All participants have been drafted. No action is needed here.
                </p>
            {/if}
        </nav>
        <nav class="card list-nav variant-ghost-success space-y-4 p-4">
            <h3 class="h3">Already Drafted ({selected.length})</h3>
            <ul class="list">
                {#each selected as user (user.email)}
                    <li><Student {user} /></li>
                {/each}
            </ul>
        </nav>
    </div>
</div>