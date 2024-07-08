<script lang="ts">
    import { Avatar, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import { enhance } from '$app/forms';
    import { format } from 'date-fns';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ draft } = data);

    let draftees: string[] = [];
</script>

{#if typeof draft === 'undefined'}
    <ErrorAlert>There is no active draft at the moment. Please check again later.</ErrorAlert>
{:else}
    {@const {
        info: { draft_id, curr_round, max_rounds, active_period_start },
        students,
    } = draft}
    {@const startDate = format(active_period_start, 'PPP')}
    {@const startTime = format(active_period_start, 'pp')}
    <div class="card prose max-w-none p-4 dark:prose-invert">
        <p>
            <strong>Draft &num;{draft_id}</strong> is currently on Round <strong>{curr_round}</strong> of
            <strong>{max_rounds}</strong>. It opened last
            <strong>{startDate}</strong>
            at <strong>{startTime}</strong>.
        </p>
    </div>
    <form method="post" class="space-y-4" use:enhance>
        <!-- TODO: Check lab quota. -->
        {#if students.length > 0}
            <ListBox multiple rounded="rounded">
                {#each students as { email, given_name, family_name, avatar, student_number } (email)}
                    <ListBoxItem bind:group={draftees} name="students" value={email}>
                        <div class="flex gap-4">
                            <Avatar src={avatar} />
                            <span class="flex flex-col">
                                <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
                                {#if student_number !== null}
                                    <span class="text-sm opacity-50">{student_number}</span>
                                {/if}
                                <span class="text-xs opacity-50">{email}</span>
                            </span>
                        </div>
                    </ListBoxItem>
                {/each}
            </ListBox>
            <!-- TODO: Set up form actions. -->
            <button type="submit" class="variant-filled-primary btn">Submit</button>
        {:else}
            <WarningAlert
                >No students have selected this lab in this round. Press "Acknowledge" to proceed to the next round of
                the draft.</WarningAlert
            >
            <button type="submit" class="variant-filled-secondary btn">Acknowledge</button>
        {/if}
    </form>
{/if}
