<script lang="ts">
    import type { Draft } from '$lib/models/draft';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let draft: Draft['draft_id'];
</script>

<form
    method="post"
    action="/dashboard/drafts/?/start"
    use:enhance={({ submitter, cancel }) => {
        if (!confirm('Are you sure you want to start the draft?')) {
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
    <input type="hidden" name="draft" value={draft} />
    <button type="submit" class="variant-ghost-warning btn w-full">Start Draft</button>
</form>
