<script>
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        user: { given_name, family_name },
    } = data);
</script>

<form method="post" use:enhance class="space-y-4">
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label>
            <span>Student Number</span>
            <input
                required
                type="number"
                min="100000000"
                max="1000000000"
                name="student-number"
                placeholder="2020XXXXX"
                class="input variant-form-material px-2 py-1"
            />
        </label>
        <label>
            <span>Given Name</span>
            <input
                required
                type="text"
                name="given"
                placeholder="Juan"
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
                placeholder="Juan"
                value={family_name}
                class="input variant-form-material px-2 py-1"
            />
        </label>
    </div>
    <button type="submit" class="variant-filled-primary btn">Register</button>
</form>
