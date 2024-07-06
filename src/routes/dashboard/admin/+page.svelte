<script lang="ts">
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';

    // eslint-disable-next-line
    export let data;
    $: ({ labs } = data);

    const toast = getToastStore();
</script>

<section class="space-y-4">
    <h1 class="h1">Lab Quotas</h1>
    <form
        method="post"
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
                    case 'error':
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
        <div class="table-container my-4">
            <table class="table table-hover table-comfortable">
                <thead>
                    <tr>
                        <th>Laboratory</th>
                        <th class="w-2/5">Quota</th>
                    </tr>
                </thead>
                <tbody>
                    {#each labs as { lab_id, lab_name, quota } (lab_id)}
                        {@const placeholder = quota.toString()}
                        <tr>
                            <td class="!align-middle">{lab_name}</td>
                            <td
                                ><input
                                    type="number"
                                    min="0"
                                    name={lab_id}
                                    {placeholder}
                                    class="input variant-form-material px-2 py-1"
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <!-- TODO: Set up form actions. -->
        <button type="submit" class="variant-filled-primary btn">Save Selection</button>
    </form>
</section>
