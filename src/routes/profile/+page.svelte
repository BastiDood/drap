<script>
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        user: { student_number, given_name, family_name },
    } = data);

    const toast = getToastStore();
</script>

<h1 class="h1">User Profile</h1>
{#if student_number === null}
    <WarningAlert>The student number may only be set once.</WarningAlert>
{/if}
<form
    method="post"
    use:enhance={({ submitter }) => {
        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;
        return async ({ update, result }) => {
            submitter.disabled = false;
            await update({ reset: false });
            switch (result.type) {
                case 'success':
                    toast.trigger({
                        message: 'Successfully updated your profile.',
                        background: 'variant-filled-success',
                    });
                    break;
                case 'failure':
                case 'error':
                    toast.trigger({
                        message: 'Failed to update your profile.',
                        background: 'variant-filled-error',
                    });
                    break;
                default:
                    break;
            }
        };
    }}
    class="space-y-4"
>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label>
            <span>Student Number</span>
            {#if student_number === null}
                <input
                    type="number"
                    min="100000000"
                    max="1000000000"
                    name="student-number"
                    placeholder="2020XXXXX"
                    class="input variant-form-material px-2 py-1"
                />
            {:else}
                {@const placeholder = student_number.toString()}
                <input
                    type="number"
                    min="100000000"
                    max="1000000000"
                    name="student-number"
                    {placeholder}
                    disabled
                    class="input variant-form-material px-2 py-1"
                />
            {/if}
        </label>
        <label>
            <span>Given Name</span>
            <input
                required
                type="text"
                name="given"
                placeholder={given_name}
                value={given_name}
                class="input variant-form-material px-2 py-1"
            />
        </label>
        <label>
            <span>Family Name</span>
            <input
                required
                type="text"
                name="family"
                placeholder={family_name}
                value={family_name}
                class="input variant-form-material px-2 py-1"
            />
        </label>
    </div>
    <button type="submit" class="variant-filled-primary btn">Update</button>
</form>
