<script lang="ts">
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  interface Props {
    draft: schema.Draft['id'];
  }

  const { draft }: Props = $props();

  const toaster = useToaster();
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
            toaster.error({
              title: 'Cannot start the draft when there are not enough participants.',
              duration: Infinity,
            });
            break;
          case 498:
            toaster.error({
              title: 'Cannot start the draft when the total lab quota is zero.',
              duration: Infinity,
            });
            break;
          default:
            break;
        }
    };
  }}
>
  <input type="hidden" name="draft" value={draft} />
  <button type="submit" class="preset-tonal-warning border-warning-500 btn w-full border"
    >Start Draft</button
  >
</form>
