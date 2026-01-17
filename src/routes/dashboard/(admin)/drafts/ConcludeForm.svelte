<script lang="ts">
  import { ArrowRight } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

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
  action="/dashboard/drafts/?/conclude"
  class="not-prose"
  use:enhance={({ submitter, cancel }) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to conclude this draft?')) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      if (result.type === 'failure') {
        assert(result.status === 403);
        toaster.error({
          title:
            'The total of all lab quota does not match the number of eligible students in the lottery.',
        });
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draft} />
  <button type="submit" class="preset-filled-primary-500 btn btn-lg w-full">
    <Icon src={ArrowRight} class="size-8" />
    <span>Conclude Draft</span>
  </button>
</form>
