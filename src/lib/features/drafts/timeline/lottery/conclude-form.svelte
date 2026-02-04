<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';

  interface Props {
    draftId: bigint;
  }

  const { draftId }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/drafts/{draftId}/?/conclude"
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
      switch (result.type) {
        case 'success':
          toast.success('Draft concluded.');
          break;
        case 'failure':
          assert(result.status === 403);
          toast.error(
            'The total of all lab quota does not match the number of eligible students in the lottery.',
          );
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draftId} />
  <Button type="submit" size="lg" class="w-full">
    <ArrowRightIcon class="size-6" />
    <span>Conclude Draft</span>
  </Button>
</form>
