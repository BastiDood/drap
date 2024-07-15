<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import RankingsForm from './RankingsForm.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { getOrdinalSuffix } from '$lib/ordinal';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        draft: { draft_id, curr_round },
        students,
        researchers,
        lab: { lab_name, quota },
        isDone,
    } = data);

    let draftees = [] as string[];
    $: remainingQuota = quota - researchers.length;
    $: remainingDraftees = remainingQuota - draftees.length;
</script>

{#if curr_round === null}
    <WarningAlert
        >The draft is now in the lottery stage. Kindly contact the draft administrators on how to proceed.</WarningAlert
    >
{:else if curr_round === 0}
    <WarningAlert
        >Students are still registering for this draft. Kindly wait for the draft administrators to officially open the
        draft.</WarningAlert
    >
{:else if isDone}
    <WarningAlert
        >This lab has already submitted their picks for this round. No action is required until the next one.</WarningAlert
    >
{:else if students.length > 0}
    {@const suffix = getOrdinalSuffix(curr_round)}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div class="prose dark:prose-invert">
            <h2>Draft Picks</h2>
            <p>
                Welcome to the draft! The <strong>{lab_name}</strong> has been allocated <strong>{quota}</strong> slots
                in total. As a lab head, you may pick at most <strong>{remainingDraftees}</strong> more students in this
                round. The following students have selected your lab as their <strong>{curr_round}{suffix}</strong>
                choice. Simply click on the student's name to toggle the selection. By default, none are selected. Note that
                you <em>not</em> required to exhaust your entire allocation in this round. You may hold off on some of your
                slots for the next round.
            </p>
            <p>
                When ready, you may press the <strong>"Submit"</strong> button. Empty submissions are allowed. In any
                case, all lab heads must submit their picks before the next round <em>automatically</em> begins. All lab
                heads and administrators will be notified when this happens.
            </p>
        </div>
        <RankingsForm draft={draft_id} {students} bind:draftees disabled={remainingDraftees <= 0} />
    </div>
{:else}
    <WarningAlert
        >No students have selected this lab in this round. No action is required until the next round.</WarningAlert
    >
{/if}
{#if researchers.length > 0}
    <h3 class="h3">Drafted Students from Previous Rounds</h3>
    <nav class="list-nav">
        <ul>
            {#each researchers as { email, given_name, family_name, avatar, student_number } (email)}
                <a href="mailto:{email}">
                    <Avatar src={avatar} />
                    <div class="flex flex-col">
                        <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
                        {#if student_number !== null}
                            <span class="text-sm opacity-50">{student_number}</span>
                        {/if}
                        <span class="text-xs opacity-50">{email}</span>
                    </div>
                </a>
            {/each}
        </ul>
    </nav>
{/if}
