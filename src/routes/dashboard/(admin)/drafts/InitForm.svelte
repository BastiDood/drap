<script>
  import { CalendarDays } from '@steeze-ui/heroicons';
  import { format } from 'date-fns';
  import { Icon } from '@steeze-ui/svelte-icon';

  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
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
  <label class="label">
    <span>Registration Closing Date</span>
    <div class="input-group grid-cols-[auto_1fr_auto]">
      <div class="ig-cell preset-tonal"><Icon src={CalendarDays} class="size-6" /></div>
      <input type="datetime-local" required name="closes-at" class="ig-input px-4 py-2" />
    </div>
  </label>
  <label class="label">
    <span>Number of Rounds</span>
    <div class="input-group grid-cols-[auto_1fr_auto]">
      <div class="ig-cell preset-tonal"><Icon src={CalendarDays} class="size-6" /></div>
      <input
        type="number"
        min="1"
        required
        name="rounds"
        placeholder="5"
        class="ig-input px-4 py-2"
      />
      <button class="ig-btn preset-filled-primary-500">Start</button>
    </div>
  </label>
</form>
