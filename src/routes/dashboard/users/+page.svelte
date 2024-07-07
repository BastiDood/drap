<script>
    import { Icon } from '@steeze-ui/svelte-icon';
    import { Plus } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs } = data);

    const toast = getToastStore();
</script>

<h1 class="h1">Faculty</h1>
<form
    method="post"
    action="?/invite"
    class="card space-y-4 p-4"
    use:enhance={({ submitter }) => {
        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;
        return async ({ update, result }) => {
            submitter.disabled = false;
            await update();
            switch (result.type) {
                case 'success':
                    toast.trigger({
                        message: 'Successfully invited a new laboratory head.',
                        background: 'variant-filled-success',
                    });
                    break;
                case 'failure':
                    assert(result.status === 409);
                    toast.trigger({
                        message: 'User or invite already exists.',
                        background: 'variant-filled-error',
                    });
                    break;
                default:
                    break;
            }
        };
    }}
>
    <label>
        <span>Invite To</span>
        <select required name="invite" class="variant-form-materal select">
            <option value="" disabled selected hidden>Send invite to...</option>
            {#each labs as { lab_id, lab_name } (lab_id)}
                <option value={lab_id}>{lab_name}</option>
            {/each}
        </select>
    </label>
    <label>
        <span>Email</span>
        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
            <div class="input-group-shim"><Icon src={Plus} class="size-6" /></div>
            <input type="email" required name="email" placeholder="example@up.edu.ph" class="px-4 py-2" />
            <button class="variant-filled-primary">Invite</button>
        </div>
    </label>
</form>
