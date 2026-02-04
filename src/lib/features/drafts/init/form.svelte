<script lang="ts" module>
  export interface Props {
    onSuccess?: () => void;
  }
</script>

<script lang="ts">
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import { format } from 'date-fns';
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
  action="/dashboard/drafts/?/init"
  class="w-full space-y-4"
  use:enhance={({ formData, submitter, cancel }) => {
    const closesAtRaw = formData.get('closesAt');
    assert(typeof closesAtRaw === 'string');

    // Transform to ISO string for correct timezone handling
    const closesAt = new Date(closesAtRaw);
    formData.set('closesAt', closesAt.toISOString());

    const rounds = formData.get('rounds');
    assert(typeof rounds === 'string');
    if (
      // eslint-disable-next-line no-alert
      !confirm(
        `Are you sure you want to start a new draft with ${rounds} rounds and with registration that closes at ${format(closesAt, 'PPPpp')}?`,
      )
    ) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success('Draft created.');
          onSuccess?.();
          break;
        case 'failure':
          toast.error('Failed to create draft.');
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="space-y-2">
    <Label for="closesAt">Registration Closing Date</Label>
    <div class="border-input flex overflow-hidden rounded-md border">
      <div class="bg-muted flex items-center px-3"><CalendarDaysIcon class="size-5" /></div>
      <Input
        type="datetime-local"
        required
        name="closesAt"
        id="closesAt"
        class="rounded-none border-0"
      />
    </div>
  </div>
  <div class="space-y-2">
    <Label for="rounds">Number of Rounds</Label>
    <Input type="number" min="1" required name="rounds" id="rounds" placeholder="5" />
  </div>
  <Button type="submit" class="w-full">Create Draft</Button>
</form>
