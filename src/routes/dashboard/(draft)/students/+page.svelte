<script lang="ts">
    import { Avatar, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getOrdinalSuffix } from './ordinal';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { draft_id, curr_round },
        students,
        researchers,
        lab: { lab_name, quota },
    } = data);

    $: suffix = getOrdinalSuffix(curr_round);

    // [x]: Prevent the user from selecting too many.
    // Resolved: Refer to the HTML TODO below
    let draftees: string[] = [];
    $: remainingQuota = quota - researchers.length;
    $: remainingDraftees = remainingQuota - draftees.length;
</script>

{#if students.length > 0}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div class="prose dark:prose-invert">
            <h2>Draft Picks</h2>
            <p>
                Welcome to the draft! The <strong>{lab_name}</strong> has been allocated <strong>{quota}</strong> slots
                in total. Note that <strong>{researchers.length}</strong> students (shown below if any) have already been
                reserved in previous rounds.
            </p>
            <nav class="not-prose list-nav">
                <ul>
                    {#each researchers as { email, given_name, family_name, avatar, student_number } (email)}
                        <li>
                            <a href="mailto:{email}">
                                <Avatar src={avatar} width="w-14" />
                                <span class="flex flex-col">
                                    <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
                                    {#if student_number !== null}
                                        <span class="text-sm opacity-50">{student_number}</span>
                                    {/if}
                                    <span class="text-xs opacity-50">{email}</span>
                                </span>
                            </a>
                        </li>
                    {/each}
                </ul>
            </nav>
            <p>
                As a lab head, you may pick at most <strong>{remainingDraftees}</strong> more students in this round.
                The following students have selected your lab as their <strong>{curr_round}{suffix}</strong> choice.
                Simply click on the student's name to toggle the selection. By default, none are selected. Note that you
                <em>not</em> required to exhaust your entire allocation in this round. You may hold off on some of your slots
                for the next round.
            </p>
            <p>
                When ready, you may press the <strong>"Submit"</strong> button. Empty submissions are allowed. In any
                case, all lab heads must submit their picks before the next round <em>automatically</em> begins. All lab
                heads and administrators will be notified when this happens.
            </p>
        </div>
        <form
            method="post"
            class="flex min-w-max flex-col gap-1"
            use:enhance={({ formData, submitter, cancel }) => {
                const count = formData.getAll('students').length;
                if (!confirm(`Are you sure you want to select these ${count} students?`)) {
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
            <button type="submit" class="variant-filled-primary btn w-full">Submit</button>
            <ListBox multiple rounded="rounded" disabled={remainingDraftees <= 0}>
                {#each students as { email, given_name, family_name, avatar, student_number } (email)}
                    <ListBoxItem bind:group={draftees} name="students" value={email}>
                        <Avatar slot="lead" src={avatar} />
                        <div class="flex flex-col">
                            <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
                            {#if student_number !== null}
                                <span class="text-sm opacity-50">{student_number}</span>
                            {/if}
                            <span class="text-xs opacity-50">{email}</span>
                        </div>
                    </ListBoxItem>
                {/each}
            </ListBox>
        </form>
    </div>
{:else}
    <!-- [x]: Show the currently drafted students under this lab. -->
    <!-- Resolved: Added disabled ListBox with already-selected researchers -->
    <!-- TODO: Please verify if this works -->
    <WarningAlert
        >No students have selected this lab in this round. No action is required until the next round.</WarningAlert
    >
    <h3>My Selected Researchers:</h3>
    <ListBox multiple rounded="rounded" disabled>
        {#each researchers as { email, given_name, family_name, avatar, student_number } (email)}
            <ListBoxItem bind:group={draftees} name="students" value={email}>
                <Avatar slot="lead" src={avatar} />
                <div class="flex flex-col">
                    <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
                    {#if student_number !== null}
                        <span class="text-sm opacity-50">{student_number}</span>
                    {/if}
                    <span class="text-xs opacity-50">{email}</span>
                </div>
            </ListBoxItem>
        {/each}
    </ListBox>
{/if}
