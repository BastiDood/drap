<script lang="ts" module>
  export interface Props {
    onSuccess?: () => void;
  }
</script>

<script lang="ts">
  import SaveIcon from '@lucide/svelte/icons/save';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const { onSuccess }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/?/user"
  class="space-y-4"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'redirect':
          toast.success('Switched to user successfully.');
          onSuccess?.();
          break;
        case 'failure':
          toast.error('Failed to switch to user.');
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="flex items-end gap-2">
    <div class="grow space-y-2">
      <Label for="user-email">Email</Label>
      <Input
        type="text"
        name="userEmail"
        id="user-email"
        required
        placeholder="example@up.edu.ph"
      />
    </div>
  </div>
  <Button type="submit" class="w-full">
    <SaveIcon class="size-5" />
    <span>Switch to Another User</span>
  </Button>
</form>
