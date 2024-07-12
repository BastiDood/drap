<script lang="ts">
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { format } from 'date-fns';
    import { getToastStore } from '@skeletonlabs/skeleton';

    // eslint-disable-next-line
    export let data;
    $: ({ draft, labs } = data);

    const toast = getToastStore();
</script>

{#if draft === null}
    <form
        method="post"
        action="?/lab"
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
        <div class="card space-y-4 p-4">
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
            <button type="submit" class="variant-filled-primary btn">Create Lab</button>
        </div>
    </form>
    <form
        method="post"
        action="?/quota"
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
        <button type="submit" class="variant-filled-primary btn">Update Lab Quota</button>
    </form>
{:else}
    {@const { draft_id, active_period_start, curr_round, max_rounds } = draft}
    {@const startDate = format(active_period_start, 'PPP')}
    {@const startTime = format(active_period_start, 'pp')}
    <WarningAlert>
        <span
            >{#if curr_round === null}
                <strong>Draft &num;{draft_id}</strong> started last <strong>{startDate}</strong> at
                <strong>{startTime}</strong> and is now in lottery mode. It's still unsafe to update the lab quota.
            {:else}
                <strong>Draft &num;{draft_id}</strong> started last <strong>{startDate}</strong> at
                <strong>{startTime}</strong> and is now in Round <strong>{curr_round}</strong> of
                <strong>{max_rounds}</strong>. It's unsafe to update the lab quota while a draft is in progress.
            {/if}</span
        >
    </WarningAlert>
{/if}
