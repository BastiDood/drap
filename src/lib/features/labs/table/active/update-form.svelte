<script lang="ts" module>
  export interface Props {
    id: string;
  }
</script>

<script lang="ts">
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';

  const { id }: Props = $props();
</script>

<form
  {id}
  method="post"
  action="/dashboard/labs/?/quota"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success('Successfully updated the lab quotas.');
          break;
        case 'failure':
          toast.error('Failed to update the lab quotas.');
          break;
        default:
          break;
      }
    };
  }}
>
  <Button type="submit">
    <PencilIcon class="size-4" />
    <span>Update Quotas</span>
  </Button>
</form>
