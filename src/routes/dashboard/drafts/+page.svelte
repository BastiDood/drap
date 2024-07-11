<script>
    import { Avatar } from '@skeletonlabs/skeleton';
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { format } from 'date-fns';

    // eslint-disable-next-line
    export let data;
    $: ({
        draft: { draft_id, curr_round, max_rounds, active_period_start },
        students,
    } = data);
    $: startDate = format(active_period_start, 'PPP');
    $: startTime = format(active_period_start, 'pp');
</script>

{#if curr_round > 0}
    <!-- TODO -->
{:else}
    <div class="card prose max-w-none p-4 dark:prose-invert">
        <p>
            <strong>Draft &num;{draft_id}</strong> is currently on Round <strong>{curr_round}</strong>
            of <strong>{max_rounds}</strong>. It opened last <strong>{startDate}</strong> at
            <strong>{startTime}</strong>.
        </p>
    </div>
    <div class="prose max-w-none dark:prose-invert">
        <h2>Registered Students</h2>
        {#if students.length > 0}
            <p>
                There are currently <strong>{students.length}</strong> students who have registered for this draft.
                Press <strong>"Start Draft"</strong> (if available) to close registration and start the draft
                automation. Lab heads will be notified about the first round. The draft proceeds to the next round when
                all lab heads have submitted their preferences. This process repeats until the configured maximum number
                of rounds have elapsed, after which the draft pauses until an administrator <em>manually</em> proceeds with
                the lottery.
            </p>
        {:else}
            <ErrorAlert
                >No students have registered for this draft yet. This draft cannot proceed to the next round until at
                least one student registers.</ErrorAlert
            >
        {/if}
    </div>
    {#if students.length > 0}
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
                {#each students as { email, given_name, family_name, avatar, student_number, labs } (email)}
                    <li>
                        <a href="mailto:{email}" class="grid w-full grid-cols-[auto_1fr] items-center gap-4 p-4">
                            <Avatar src={avatar} width="w-20" />
                            <div class="flex flex-col">
                                <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
                                {#if student_number !== null}
                                    <span class="text-sm opacity-50">{student_number}</span>
                                {/if}
                                <span class="text-xs opacity-50">{email}</span>
                                <div class="space-x-1">
                                    {#each labs as lab (lab)}
                                        <span class="variant-ghost-primary badge text-xs">{lab}</span>
                                    {/each}
                                </div>
                            </div>
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>
    {/if}
{/if}
