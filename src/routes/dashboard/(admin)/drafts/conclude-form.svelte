<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

  interface Props {
    draft: schema.Draft['id'];
  }

  const { draft }: Props = $props();
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
        toast.error(
          'The total of all lab quota does not match the number of eligible students in the lottery.',
        );
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draft} />
  <Button type="submit" size="lg" class="w-full">
    <ArrowRight class="size-6" />
    <span>Conclude Draft</span>
  </Button>
</form>
