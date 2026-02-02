<script lang="ts">
  import { assert } from '$lib/assert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { schema } from '$lib/server/database/drizzle';

  export interface User extends Pick<schema.User, 'givenName' | 'familyName'> {
    studentNumber: bigint;
  }

  interface Props {
    user: User;
    onSuccess?: () => void;
  }

  const { user, onSuccess }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/?/profile"
  class="space-y-4"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      if (onSuccess && result.type === 'success') onSuccess();
    };
  }}
>
  <div class="space-y-2">
    <Label>Student Number</Label>
    <div class="flex h-9 items-center">
      <Badge variant="secondary" class="text-sm">{user.studentNumber.toString()}</Badge>
    </div>
  </div>
  <div class="space-y-2">
    <Label for="given">Given Name</Label>
    <Input required type="text" name="given" id="given" value={user.givenName} />
  </div>
  <div class="space-y-2">
    <Label for="family">Family Name</Label>
    <Input required type="text" name="family" id="family" value={user.familyName} />
  </div>
  <Button type="submit" class="w-full">Update Profile</Button>
</form>
