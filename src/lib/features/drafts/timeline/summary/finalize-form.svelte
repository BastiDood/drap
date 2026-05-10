<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { toast } from 'svelte-sonner';
  import { useQueryClient } from '@tanstack/svelte-query'; // eslint-disable-line no-restricted-imports

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();
  const queryClient = useQueryClient();
</script>

<form
  method="post"
  action="/dashboard/drafts/{draftId}/?/finalize"
  class="not-prose"
  use:enhance={({ submitter, cancel }) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Finalize this draft and dispatch result emails?')) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      await queryClient.invalidateQueries({ queryKey: ['drafts', draftId] });
      switch (result.type) {
        case 'success':
          toast.success('Draft finalized.');
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draftId} />
  <Button
    type="submit"
    size="lg"
    class="w-full bg-warning text-warning-foreground hover:bg-warning/80"
  >
    <CheckIcon class="size-6" />
    <span>Finalize Draft</span>
  </Button>
</form>
