<script lang="ts" module>
  import type { schema } from '$lib/server/database/drizzle';

  export interface Props {
    user: Pick<schema.User, 'isAdmin' | 'labId'>;
    onSuccess?: () => void;
  }
</script>

<script lang="ts">
  import SaveIcon from '@lucide/svelte/icons/save';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const { user, onSuccess }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/?/role"
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
          toast.success('Role updated successfully.');
          onSuccess?.();
          break;
        case 'failure':
          toast.error('Failed to update role.');
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="flex items-end gap-2">
    <div class="grow space-y-2">
      <Label for="lab-id">Lab ID</Label>
      <Input type="text" name="labId" id="lab-id" value={user.labId} placeholder="(none)" />
    </div>
    <div class="flex items-center gap-2">
      <Checkbox name="isAdmin" id="is-admin" checked={user.isAdmin} class="size-9" />
      <Label for="is-admin">Admin</Label>
    </div>
  </div>
  <Button type="submit" class="w-full">
    <SaveIcon class="size-5" />
    <span>Save Role</span>
  </Button>
</form>
