<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import { PaperAirplane } from '@steeze-ui/heroicons';
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;
  interface Props {
    labs: Lab[];
  }

  const { labs }: Props = $props();

  const toaster = useToaster();
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
          toaster.success({ title: 'Successfully invited a new laboratory head.' });
          break;
        case 'failure':
          assert(result.status === 409);
          toaster.error({ title: 'User or invite already exists.' });
          break;
        default:
          break;
      }
    };
  }}
>
  <label class="label">
    <span>Laboratory</span>
    <select required name="invite" class="select">
      <option value="" disabled selected hidden>Send invite to...</option>
      {#each labs as { id, name } (id)}
        <option value={id}>{name}</option>
      {/each}
    </select>
  </label>
  <label class="label">
    <span>Email</span>
    <div class="input-group grid-cols-[auto_1fr_auto]">
      <div class="ig-cell preset-tonal"><Icon src={PaperAirplane} class="size-6" /></div>
      <input
        type="email"
        required
        name="email"
        placeholder="example@up.edu.ph"
        class="ig-input px-4 py-2"
      />
      <button class="ig-btn preset-filled-primary-500">Invite</button>
    </div>
  </label>
</form>
