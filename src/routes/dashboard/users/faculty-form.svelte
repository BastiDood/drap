<script lang="ts">
  import { enhance } from '$app/forms';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as NativeSelect from '$lib/components/ui/native-select';
  import type { schema } from '$lib/server/database/drizzle';
  import SendIcon from '@lucide/svelte/icons/send';
  // eslint-disable-next-line no-restricted-imports
  import { useQueryClient } from '@tanstack/svelte-query';
  import { toast } from 'svelte-sonner';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;
  interface Props {
    labs: Lab[];
  }

  const { labs }: Props = $props();
  const queryClient = useQueryClient();
</script>

<form
  method="post"
  action="/dashboard/users/?/faculty"
  class="space-y-2"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      await queryClient.invalidateQueries({ queryKey: ['users', 'invited', 'heads'] });
      switch (result.type) {
        case 'success':
          toast.success('Successfully invited a new laboratory head.');
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
    <Label for="lab-select">Laboratory</Label>
    <NativeSelect.Root required name="invite" id="lab-select">
      <NativeSelect.Option value="" disabled selected hidden>Send invite to...</NativeSelect.Option>
      {#each labs as { id, name } (id)}
        <NativeSelect.Option value={id}>{name}</NativeSelect.Option>
      {/each}
    </NativeSelect.Root>
  </div>
  <div class="space-y-2">
    <Label for="faculty-email">Email</Label>
    <div class="flex overflow-hidden rounded-md border border-input">
      <div class="flex items-center bg-muted px-3"><SendIcon class="size-5" /></div>
      <Input
        type="email"
        required
        name="email"
        id="faculty-email"
        placeholder="example@up.edu.ph"
        class="grow rounded-none border-0"
      />
      <Button type="submit" class="rounded-l-none">Invite</Button>
    </div>
  </div>
</form>
