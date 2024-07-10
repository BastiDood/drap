<script lang="ts">
    import { Avatar, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ students } = data);

    let draftees: string[] = [];
</script>

{#if students.length > 0}
    <form method="post" class="space-y-4" use:enhance>
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
    </form>
{:else}
    <WarningAlert
        >No students have selected this lab in this round. No action is required until the next round.</WarningAlert
    >
{/if}
