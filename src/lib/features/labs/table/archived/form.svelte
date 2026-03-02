<script lang="ts" module>
  export interface Props {
    labId: string;
    labName: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  const { labId, labName, disabled = false }: Props = $props();
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
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props })}
        <Button {...props} type="submit" variant="secondary" size="icon-sm" {disabled}>
          <ArchiveRestoreIcon class="size-4" />
        </Button>
      {/snippet}
    </TooltipTrigger>
    <TooltipContent side="left">Restore {labId.toUpperCase()}</TooltipContent>
  </Tooltip>
</form>
