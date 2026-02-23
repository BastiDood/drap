<script lang="ts">
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
      switch (result.type) {
        case 'success':
          toast.success('Draft started.');
          break;
        case 'failure':
          switch (result.status) {
            case 497:
              toast.error('Cannot start the draft when there are not enough participants.', {
                duration: Infinity,
                dismissable: true,
              });
              break;
            default:
              toast.error('Failed to start the draft.');
              break;
          }
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
    variant="outline"
    class="border-warning bg-warning/10 text-warning hover:bg-warning/20 w-full"
  >
    Start Draft
  </Button>
</form>
