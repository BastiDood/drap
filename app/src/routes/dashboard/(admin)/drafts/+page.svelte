<script>
    import Student from '$lib/users/Student.svelte';
    import { format } from 'date-fns';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    import ConcludeForm from './ConcludeForm.svelte';
    import InitForm from './InitForm.svelte';
    import InterveneForm from './InterveneForm.svelte';
    import StartForm from './StartForm.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs } = data);
</script>

{#if data.draft === null}
    {#if labs.some(({ quota }) => quota > 0)}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div class="prose dark:prose-invert">
                <h2>Start a New Draft</h2>
                <p>
                    Welcome to the <strong>Draft Ranking Automated Processor</strong>! There are currently no drafts
                    happening at the moment, but as an administrator, you have the authorization to start a new one.
                </p>
                <p>
                    To begin, simply provide the the maximum number of rounds for the upcoming draft. This has
                    historically been set to <strong>5</strong>.
                </p>
            </div>
            <InitForm />
        </div>
    {:else}
        <ErrorAlert
            >The total quota of all labs is currently zero. Please <a href="/dashboard/labs/" class="anchor">allocate</a
            > at least one slot to a lab to proceed.</ErrorAlert
        >
    {/if}
{:else}
    {@const {
        draft: { draft_id, curr_round, max_rounds, active_period_start },
        available,
        selected,
    } = data}
    {@const startDate = format(active_period_start, 'PPP')}
    {@const startTime = format(active_period_start, 'pp')}
    <div class="card prose dark:prose-invert max-w-none p-4">
        <p>
            {#if curr_round === null}
                <strong>Draft &num;{draft_id}</strong> (which opened last <strong>{startDate}</strong> at
                <strong>{startTime}</strong>) has recently finished the main drafting process. It is currently in the
                lottery rounds.
            {:else}
                <strong>Draft &num;{draft_id}</strong> is currently on Round <strong>{curr_round}</strong>
                of <strong>{max_rounds}</strong>. It opened last <strong>{startDate}</strong> at
                <strong>{startTime}</strong>.
            {/if}
        </p>
    </div>
    {#if curr_round === null}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
            <div class="prose dark:prose-invert">
                <h3>Lottery</h3>
                <p>
                    Draft &num;{draft_id} is almost done! The final stage is the lottery phase, where the remaining undrafted
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
                <ConcludeForm draft={draft_id} />
            </div>
            <div class="min-w-max space-y-2">
                <nav class="card list-nav variant-ghost-warning space-y-4 p-4">
                    <h3 class="h3">Eligible for Lottery ({available.length})</h3>
                    {#if available.length > 0}
                        <InterveneForm draft={draft_id} {labs} students={available} />
                    {:else}
                        <p class="prose dark:prose-invert max-w-none">
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
    {:else if curr_round > 0}
        <!-- TODO: Ongoing Draft (ADMIN DASHBOARD) -->
        <!-- TODO: Registered Students -->
        <!-- TODO: Submitted Lab Preferences -->
        <!-- TODO: Start + End Dates for Draft (?) -->
        <!-- TODO: System Automation Logs -->
    {:else if available.length > 0}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div class="space-y-4">
                <section class="prose dark:prose-invert">
                    <h2>Registered Students</h2>
                    <p>
                        There are currently <strong>{available.length}</strong> students who have registered for this
                        draft. Press the <strong>"Start Draft"</strong> button to close registration and start the draft
                        automation.
                    </p>
                    <p>
                        Lab heads will be notified when the first round begins. The draft proceeds to the next round
                        when all lab heads have submitted their preferences. This process repeats until the configured
                        maximum number of rounds has elapsed, after which the draft pauses until an administrator <em
                            >manually</em
                        > proceeds with the lottery stage.
                    </p>
                </section>
                <StartForm draft={draft_id} />
            </div>
            <nav class="list-nav w-full">
                <ul class="list">
                    {#each available as user (user.email)}
                        <li><Student {user} /></li>
                    {/each}
                </ul>
            </nav>
        </div>
    {:else}
        <WarningAlert
            >No students have registered for this draft yet. This draft cannot proceed to the next round until at least
            one student registers.</WarningAlert
        >
    {/if}
{/if}
