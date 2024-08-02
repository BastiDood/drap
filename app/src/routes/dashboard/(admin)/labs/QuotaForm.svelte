<script lang="ts">
    import { Icon } from '@steeze-ui/svelte-icon';
    import { PencilSquare } from '@steeze-ui/heroicons';
    import type { RegisteredLabs } from '$lib/server/database';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';

    // eslint-disable-next-line init-declarations
    export let labs: RegisteredLabs;
    $: total = labs.reduce((total, { quota }) => total + quota, 0);

    const toast = getToastStore();
</script>

<form
    method="post"
    action="/dashboard/labs/?/quota"
    class="space-y-4"
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
                        message: 'Successfully updated the lab quotas.',
                        background: 'variant-filled-success',
                    });
                    break;
                case 'failure':
                    toast.trigger({
                        message: 'Failed to update the lab quotas.',
                        background: 'variant-filled-error',
                    });
                    break;
                default:
                    break;
            }
        };
    }}
>
    <div class="table-container">
        <table class="table-hover table-comfortable table">
            <thead>
                <tr>
                    <th>Laboratory</th>
                    <th class="table-cell-fit">Quota ({total})</th>
                </tr>
            </thead>
            <tbody>
                {#each labs as { lab_id, lab_name, quota } (lab_id)}
                    {@const placeholder = quota.toString()}
                    <tr>
                        <td class="!align-middle">{lab_name}</td>
                        <td class="table-cell-fit"
                            ><input
                                type="number"
                                min="0"
                                name={lab_id}
                                {placeholder}
                                class="input variant-form-material px-2 py-1"
                            /></td
                        >
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <button type="submit" class="variant-filled-primary btn w-full">
        <span><Icon src={PencilSquare} class="h-6" /></span>
        <span>Update Lab Quota</span>
    </button>
</form>
