<script>
  import PlusCircleIcon from '@lucide/svelte/icons/plus-circle';
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <form
      method="post"
      action="/dashboard/labs/?/lab"
      class="space-y-4"
      use:enhance={({ submitter }) => {
        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;
        return async ({ update, result }) => {
          submitter.disabled = false;
          await update();
          switch (result.type) {
            case 'success':
              toast.success('Created new laboratory.');
              break;
            case 'failure':
              toast.error('Failed to create a new laboratory.');
              break;
            default:
              break;
          }
        };
      }}
    >
      <div class="space-y-2">
        <Label for="lab-id">Lab ID</Label>
        <Input type="text" required name="id" id="lab-id" placeholder="dcs" pattern="[a-z0-9]+" />
      </div>
      <div class="space-y-2">
        <Label for="lab-name">Lab Name</Label>
        <Input
          type="text"
          required
          name="name"
          id="lab-name"
          placeholder="Department of Computer Science"
        />
      </div>
      <Button type="submit" class="w-full">
        <PlusCircleIcon class="size-5" />
        <span>Create Lab</span>
      </Button>
    </form>
  </Card.Content>
</Card.Root>
