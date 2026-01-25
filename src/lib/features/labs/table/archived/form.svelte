<script lang="ts" module>
  export interface Props {
    labId: string;
    labName: string;
  }
</script>

<script lang="ts">
  import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';

  const { labId, labName }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/labs/?/restore"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success(`Successfully restored ${labName} (${labId})`);
          break;
        case 'failure':
          toast.error(`Failed to restore ${labName} (${labId})`);
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="restore" value={labId} />
  <Button type="submit" variant="secondary" size="icon-sm">
    <ArchiveRestoreIcon class="size-4" />
    <span class="sr-only">Restore {labId.toUpperCase()}</span>
  </Button>
</form>
