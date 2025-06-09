<script>
    import { Icon } from '@steeze-ui/svelte-icon';
    import { PaperAirplane } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';
    const toast = getToastStore();
</script>

<form
    method="post"
    action="/dashboard/users/?/admin"
    class="space-y-2"
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
                        message: 'Successfully invited a new draft administrator.',
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
        <span>Email</span>
        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
            <div class="input-group-shim"><Icon src={PaperAirplane} class="size-6" /></div>
            <input type="email" required name="email" placeholder="example@up.edu.ph" class="px-4 py-2" />
            <button class="variant-filled-primary">Invite</button>
        </div>
    </label>
</form>
