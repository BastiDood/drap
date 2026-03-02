<script lang="ts" module>
  export interface Props {
    labId: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  const { labId, disabled = false }: Props = $props();
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
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props })}
        <Button {...props} type="submit" variant="destructive" size="icon-sm" {disabled}>
          <ArchiveIcon class="size-4" />
        </Button>
      {/snippet}
    </TooltipTrigger>
    <TooltipContent side="left">Archive {labId.toUpperCase()}</TooltipContent>
  </Tooltip>
</form>
