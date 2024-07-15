<script>
    import { CalendarDays } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { validateString } from '$lib/forms';
</script>

<form
    method="post"
    action="/dashboard/drafts/?/init"
    class="w-full"
    use:enhance={({ formData, submitter, cancel }) => {
        const rounds = parseInt(validateString(formData.get('rounds')), 10);
        if (!confirm(`Are you sure you want to start a new draft with ${rounds} rounds?`)) {
            cancel();
            return;
        }
        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;
        return async ({ update }) => {
            submitter.disabled = false;
            await update();
        };
    }}
>
    <label>
        <span>Number of Rounds</span>
        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
            <div class="input-group-shim"><Icon src={CalendarDays} class="size-6" /></div>
            <input type="number" min="1" required name="rounds" placeholder="5" class="px-4 py-2" />
            <button class="variant-filled-primary">Start</button>
        </div>
    </label>
</form>
