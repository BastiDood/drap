<script>
  import { Icon } from '@steeze-ui/svelte-icon';
  import { PlusCircle } from '@steeze-ui/heroicons';

  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import { useToaster } from '$lib/toast';

  const toaster = useToaster();
</script>

<form
  method="post"
  action="/dashboard/labs/?/lab"
  class="card space-y-4 p-4"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toaster.success({ title: 'Created new laboratory.' });
          break;
        case 'failure':
          toaster.error({ title: 'Failed to create a new laboratory.' });
          break;
        default:
          break;
      }
    };
  }}
>
  <label class="label">
    <span>Lab ID</span>
    <input
      type="text"
      required
      name="id"
      placeholder="dcs"
      pattern="[a-z0-9]+"
      class="input variant-form-material px-2 py-1"
    />
  </label>
  <label class="label">
    <span>Lab Name</span>
    <input
      type="text"
      required
      name="name"
      placeholder="Department of Computer Science"
      class="input variant-form-material px-2 py-1"
    />
  </label>
  <button type="submit" class="preset-filled-primary-500 btn w-full">
    <span><Icon src={PlusCircle} class="h-6" /></span>
    <span>Create Lab</span>
  </button>
</form>
