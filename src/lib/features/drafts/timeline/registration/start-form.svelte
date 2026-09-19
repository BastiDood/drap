<script lang="ts">
  import { enhance } from '$app/forms';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { useQueryClient } from '@tanstack/svelte-query'; // eslint-disable-line no-restricted-imports
  import { toast } from 'svelte-sonner';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();
  const queryClient = useQueryClient();
</script>

<form
  method="post"
  action="/dashboard/drafts/{draftId}/?/start"
  use:enhance={({ submitter, cancel }) => {
    // eslint-disable-next-line no-alert
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
      await queryClient.invalidateQueries({ queryKey: ['drafts', draftId] });
      switch (result.type) {
        case 'success':
          toast.success('Draft started.');
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draftId} />
  <Button type="submit">
    <CheckIcon class="size-4" />
    <span>Start Draft</span>
  </Button>
</form>
