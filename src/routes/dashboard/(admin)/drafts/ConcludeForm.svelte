<script lang="ts">
    import { ArrowRight } from '@steeze-ui/heroicons';
    import type { Draft } from '$lib/models/draft';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let draft: Draft['draft_id'];
</script>

<form
    method="post"
    action="/dashboard/drafts/?/conclude"
    class="not-prose"
    use:enhance={({ submitter, cancel }) => {
        if (!confirm('Are you sure you want to conclude this draft?')) {
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
    <button type="submit" class="variant-filled-primary btn btn-lg w-full">
        <Icon src={ArrowRight} class="size-8" />
        <span>Conclude Draft</span>
    </button>
</form>
