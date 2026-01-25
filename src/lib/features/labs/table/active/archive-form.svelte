<script lang="ts" module>
  export interface Props {
    labId: string;
  }
</script>

<script lang="ts">
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';

  const { labId }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/labs/?/archive"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success(`Successfully archived lab: ${labId}`);
          break;
        case 'failure':
          toast.error(`Failed to archive lab: ${labId}`);
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="archive" value={labId} />
  <Button type="submit" variant="destructive" size="icon-sm">
    <ArchiveIcon class="size-4" />
    <span class="sr-only">Archive {labId.toUpperCase()}</span>
  </Button>
</form>
