<script lang="ts">
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { schema } from '$lib/server/database';

  interface Props {
    draft: schema.Draft['id'];
  }

  const { draft }: Props = $props();

  const toast = getToastStore();
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
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      if (result.type === 'failure')
        switch (result.status) {
          case 497:
            toast.trigger({
              message: 'Cannot start the draft when there are not enough participants.',
              background: 'variant-filled-error',
              autohide: false,
            });
            break;
          case 498:
            toast.trigger({
              message: 'Cannot start the draft when the total lab quota is zero.',
              background: 'variant-filled-error',
              autohide: false,
            });
            break;
          default:
            break;
        }
    };
  }}
>
  <input type="hidden" name="draft" value={draft} />
  <button type="submit" class="variant-ghost-warning btn w-full">Start Draft</button>
</form>
