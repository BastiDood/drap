<script>
  import Send from '@lucide/svelte/icons/send';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
</script>

<form
  method="post"
  action="/dashboard/users/?/admin"
  class="space-y-2"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success('Successfully invited a new draft administrator.');
          break;
        case 'failure':
          assert(result.status === 409);
          toast.error('User or invite already exists.');
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="space-y-2">
    <Label for="admin-email">Email</Label>
    <div class="border-input flex overflow-hidden rounded-md border">
      <div class="bg-muted flex items-center px-3"><Send class="size-5" /></div>
      <Input
        type="email"
        required
        name="email"
        id="admin-email"
        placeholder="example@up.edu.ph"
        class="flex-1 rounded-none border-0"
      />
      <Button type="submit" class="rounded-l-none">Invite</Button>
    </div>
  </div>
</form>
