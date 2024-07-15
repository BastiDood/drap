<script>
    import { Icon } from '@steeze-ui/svelte-icon';
    import { PlusCircle } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';
    const toast = getToastStore();
</script>

<form
    method="post"
    action="/dashboard/labs/?/lab"
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
                        message: 'Created new laboratory.',
                        background: 'variant-filled-success',
                    });
                    break;
                case 'failure':
                    toast.trigger({
                        message: 'Failed to create a new laboratory.',
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
        <span>Lab ID</span>
        <input
            type="text"
            required
            name="id"
            placeholder="dcs"
            pattern="[a-z0-9]+"
            class="input variant-form-material px-2 py-1"
        />
    </label>
    <label>
        <span>Lab Name</span>
        <input
            type="text"
            required
            name="name"
            placeholder="Department of Computer Science"
            class="input variant-form-material px-2 py-1"
        />
    </label>
    <button type="submit" class="variant-filled-primary btn w-full">
        <span><Icon src={PlusCircle} class="h-6" /></span>
        <span>Create Lab</span>
    </button>
</form>
