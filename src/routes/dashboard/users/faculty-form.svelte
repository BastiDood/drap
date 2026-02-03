<script lang="ts">
  import SendIcon from '@lucide/svelte/icons/send';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { schema } from '$lib/server/database/drizzle';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;
  interface Props {
    labs: Lab[];
  }

  const { labs }: Props = $props();
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
    <select
      required
      name="invite"
      id="lab-select"
      class="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
    >
      <option value="" disabled selected hidden>Send invite to...</option>
      {#each labs as { id, name } (id)}
        <option value={id}>{name}</option>
      {/each}
    </select>
  </div>
  <div class="space-y-2">
    <Label for="faculty-email">Email</Label>
    <div class="border-input flex overflow-hidden rounded-md border">
      <div class="bg-muted flex items-center px-3"><SendIcon class="size-5" /></div>
      <Input
        type="email"
        required
        name="email"
        id="faculty-email"
        placeholder="example@up.edu.ph"
        class="flex-1 rounded-none border-0"
      />
      <Button type="submit" class="rounded-l-none">Invite</Button>
    </div>
  </div>
</form>
