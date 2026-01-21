<script>
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import { format } from 'date-fns';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { validateString } from '$lib/forms';
</script>

<form
  method="post"
  action="/dashboard/drafts/?/init"
  class="w-full space-y-2"
  use:enhance={({ formData, submitter, cancel }) => {
    const rounds = parseInt(validateString(formData.get('rounds')), 10);
    const closesAt = new Date(validateString(formData.get('closes-at')));
    if (
      // eslint-disable-next-line no-alert
      !confirm(
        `Are you sure you want to start a new draft with ${rounds} rounds and with registation that closes at ${format(closesAt, 'PPPpp')}?`,
      )
    ) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update }) => {
      submitter.disabled = false;
      await update();
    };
  }}
>
  <div class="space-y-1">
    <Label for="closes-at">Registration Closing Date</Label>
    <div class="border-input flex overflow-hidden rounded-md border">
      <div class="bg-muted flex items-center px-3"><CalendarDays class="size-5" /></div>
      <Input
        type="datetime-local"
        required
        name="closes-at"
        id="closes-at"
        class="rounded-none border-0"
      />
    </div>
  </div>
  <div class="space-y-1">
    <Label for="rounds">Number of Rounds</Label>
    <div class="border-input flex overflow-hidden rounded-md border">
      <div class="bg-muted flex items-center px-3"><CalendarDays class="size-5" /></div>
      <Input
        type="number"
        min="1"
        required
        name="rounds"
        id="rounds"
        placeholder="5"
        class="flex-1 rounded-none border-0"
      />
      <Button type="submit" class="rounded-l-none">Start</Button>
    </div>
  </div>
</form>
