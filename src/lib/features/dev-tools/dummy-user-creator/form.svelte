<script lang="ts" module>
  export interface Props {
    onSuccess?: () => void;
  }
</script>

<script lang="ts">
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
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
  action="/dashboard/?/dummy"
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
          toast.success('Dummy user created successfully.');
          onSuccess?.();
          break;
        case 'failure':
          switch (result.status) {
            case 422:
              toast.error('Invalid dummy user input.');
              break;
            default:
              toast.error('Failed to create dummy user.');
              break;
          }
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="email">Email</Label>
      <Input type="email" name="email" id="email" placeholder="example@up.edu.ph" required />
    </div>
    <div class="space-y-2">
      <Label for="given-name">Given Name</Label>
      <Input type="text" name="givenName" id="given-name" placeholder="Juan" required />
    </div>
    <div class="space-y-2">
      <Label for="family-name">Family Name</Label>
      <Input type="text" name="familyName" id="family-name" placeholder="de la Cruz" required />
    </div>
  </div>
  <Button type="submit" class="w-full">
    <UserPlusIcon class="size-5" />
    <span>Create User</span>
  </Button>
</form>
