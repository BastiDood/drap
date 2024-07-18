<script lang="ts">
    import { Avatar, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import type { Draft } from '$lib/models/draft';
    import type { QueriedLabMembers } from '$lib/server/database';
    import type { User } from '$lib/models/user';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let disabled: boolean;
    // eslint-disable-next-line init-declarations
    export let draft: Draft['draft_id'];
    // eslint-disable-next-line init-declarations
    export let students: QueriedLabMembers;
    // eslint-disable-next-line init-declarations
    export let draftees: User['email'][];
</script>

<form
    method="post"
    action="/dashboard/students/?/rankings"
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
    <input type="hidden" name="draft" value={draft} />
    <button type="submit" class="variant-filled-primary btn w-full">Submit</button>
    <ListBox multiple rounded="rounded" {disabled}>
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
