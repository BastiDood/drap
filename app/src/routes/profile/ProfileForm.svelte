<script lang="ts">
    import type { User } from 'drap-model/user';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let studentNumber: User['student_number'];
    // eslint-disable-next-line init-declarations
    export let givenName: User['given_name'];
    // eslint-disable-next-line init-declarations
    export let familyName: User['family_name'];
</script>

<form
    method="post"
    action="/profile/?/profile"
    class="space-y-4"
    use:enhance={({ submitter }) => {
        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;
        return async ({ update }) => {
            submitter.disabled = false;
            await update();
        };
    }}
>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label>
            <span>Student Number</span>
            {#if studentNumber === null}
                <input
                    type="number"
                    min="100000000"
                    max="1000000000"
                    name="student-number"
                    placeholder="2020XXXXX"
                    class="input variant-form-material px-2 py-1"
                />
            {:else}
                {@const placeholder = studentNumber.toString()}
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
                placeholder={givenName}
                value={givenName}
                class="input variant-form-material px-2 py-1"
            />
        </label>
        <label>
            <span>Family Name</span>
            <input
                required
                type="text"
                name="family"
                placeholder={familyName}
                value={familyName}
                class="input variant-form-material px-2 py-1"
            />
        </label>
    </div>
    <button type="submit" class="variant-filled-primary btn">Update</button>
</form>
