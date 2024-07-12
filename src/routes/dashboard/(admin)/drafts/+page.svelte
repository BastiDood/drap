<script>
    import { ArrowRight, ShieldExclamation } from '@steeze-ui/heroicons';
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { Icon } from '@steeze-ui/svelte-icon';
    import LotteryStudent from './LotteryStudent.svelte';
    import Student from '$lib/users/Student.svelte';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { format } from 'date-fns';
    import { getToastStore } from '@skeletonlabs/skeleton';

    const toast = getToastStore();

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { draft_id, curr_round, max_rounds, active_period_start },
        labs,
        available,
        selected,
    } = data);
    $: startDate = format(active_period_start, 'PPP');
    $: startTime = format(active_period_start, 'pp');
</script>

<div class="card prose max-w-none p-4 dark:prose-invert">
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
                    Meanwhile, the <strong>"Already Drafted"</strong> section features an <em>immutable</em> list of students
                    who have already been drafted into their respective labs. These are considered final.
                </li>
            </ul>
            <p>
                When ready, administrators can press the <strong>"Conclude Draft"</strong> button to proceed with the randomization
                stage. The list of students will be randomly shuffled and distributed among the labs in a round-robin fashion.
                To uphold fairness, it is important that uneven distributions are manually resolved beforehand.
            </p>
            <p>
                After the randomization stage, the draft process is officially complete. All students, lab heads, and
                administrators are notified of the final results.
            </p>
            <form
                action="?/conclude"
                method="post"
                class="not-prose"
                use:enhance={({ submitter, cancel }) => {
                    if (!confirm('Are you sure you want to apply these interventions?')) {
                        cancel();
                        return;
                    }
                    assert(submitter !== null);
                    assert(submitter instanceof HTMLButtonElement);
                    submitter.disabled = true;
                    return async ({ update }) => {
                        submitter.disabled = false;
                        await update();
                    };
                }}
            >
                <button type="submit" class="variant-filled-primary btn btn-lg w-full">
                    <Icon src={ArrowRight} class="size-8" />
                    <span>Conclude Draft</span>
                </button>
            </form>
        </div>
        <div class="min-w-max space-y-2">
            <nav class="card list-nav variant-ghost-warning space-y-4 p-4">
                <h3 class="h3">Eligible for Lottery</h3>
                {#if available.length > 0}
                    <form
                        action="?/intervene"
                        method="post"
                        class="space-y-4"
                        use:enhance={({ submitter, cancel }) => {
                            if (!confirm('Are you sure you want to apply these interventions?')) {
                                cancel();
                                return;
                            }
                            assert(submitter !== null);
                            assert(submitter instanceof HTMLButtonElement);
                            submitter.disabled = true;
                            return async ({ update, result }) => {
                                submitter.disabled = false;
                                await update();
                                switch (result.type) {
                                    case 'success':
                                        toast.trigger({
                                            message: 'Successfully applied the interventions.',
                                            background: 'variant-filled-success',
                                        });
                                        break;
                                    default:
                                        break;
                                }
                            };
                        }}
                    >
                        <ul class="list">
                            {#each available as user (user.email)}
                                <li><LotteryStudent {labs} {user} /></li>
                            {/each}
                        </ul>
                        <input type="hidden" name="draft" value={draft_id} />
                        <button type="submit" class="!variant-glass-warning btn btn-lg w-full">
                            <Icon src={ShieldExclamation} class="size-8" />
                            <span>Apply Interventions</span>
                        </button>
                    </form>
                {:else}
                    <p class="prose max-w-none dark:prose-invert">
                        Congratulations! All participants have been drafted. No action is needed here.
                    </p>
                {/if}
            </nav>
            <nav class="card list-nav variant-ghost-success space-y-4 p-4">
                <h3 class="h3">Already Drafted</h3>
                <ul class="list">
                    {#each selected as user (user.email)}
                        <li><Student {user} /></li>
                    {/each}
                </ul>
            </nav>
        </div>
    </div>
{:else if curr_round > 0}
    <!-- TODO: Ongoing Draft -->
{:else}
    <div class="prose max-w-none dark:prose-invert">
        <h2>Registered Students</h2>
        {#if available.length > 0}
            <p>
                There are currently <strong>{available.length}</strong> students who have registered for this draft.
                Press the <strong>"Start Draft"</strong> button to close registration and start the draft automation.
                Lab heads will be notified about the first round. The draft proceeds to the next round when all lab
                heads have submitted their preferences. This process repeats until the configured maximum number of
                rounds have elapsed, after which the draft pauses until an administrator <em>manually</em> proceeds with
                the lottery.
            </p>
        {:else}
            <ErrorAlert
                >No students have registered for this draft yet. This draft cannot proceed to the next round until at
                least one student registers.</ErrorAlert
            >
        {/if}
    </div>
    {#if available.length > 0}
        <form
            method="post"
            action="?/start"
            use:enhance={({ submitter, cancel }) => {
                if (!confirm('Are you sure you want to start the draft?')) {
                    cancel();
                    return;
                }
                assert(submitter !== null);
                assert(submitter instanceof HTMLButtonElement);
                submitter.disabled = true;
                return async ({ update }) => {
                    submitter.disabled = false;
                    await update();
                };
            }}
        >
            <input type="hidden" name="draft" value={draft_id} />
            <button type="submit" class="variant-ghost-warning btn">Start Draft</button>
        </form>
        <nav class="list-nav">
            <ul class="list">
                {#each available as user (user.email)}
                    <li><Student {user} /></li>
                {/each}
            </ul>
        </nav>
    {/if}
{/if}
