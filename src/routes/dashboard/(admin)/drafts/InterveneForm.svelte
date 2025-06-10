<script lang="ts">
    import { Icon } from '@steeze-ui/svelte-icon';
    import LotteryStudent from './LotteryStudent.svelte';
    import { ShieldExclamation } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import type { schema } from '$lib/server/database';

    type Lab = Pick<schema.Lab, 'id' | 'name'>;
    type User = Pick<schema.User, 'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'>;

    // eslint-disable-next-line init-declarations
    export let draft: schema.Draft['id'];
    // eslint-disable-next-line init-declarations
    export let labs: Lab[];
    // eslint-disable-next-line init-declarations
    export let students: User[];

    const toast = getToastStore();
</script>

<form
    method="post"
    action="/dashboard/drafts/?/intervene"
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
            if (result.type === 'success') {
                toast.trigger({
                    message: 'Successfully applied the interventions.',
                    background: 'variant-filled-success',
                });
                return;
            }
        };
    }}
>
    <ul class="list">
        {#each students as { id, ...user } (id)}
            <li><LotteryStudent {labs} {user} /></li>
        {/each}
    </ul>
    <input type="hidden" name="draft" value={draft} />
    <button type="submit" class="!variant-glass-warning btn btn-lg w-full">
        <Icon src={ShieldExclamation} class="size-8" />
        <span>Apply Interventions</span>
    </button>
</form>
