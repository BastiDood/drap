<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import { PencilSquare } from '@steeze-ui/heroicons';
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota'>;
  interface Props {
    labs: Lab[];
  }

  const { labs }: Props = $props();
  const total = $derived(labs.reduce((total, { quota }) => total + quota, 0));

  const toaster = useToaster();
</script>

<form
  method="post"
  action="/dashboard/labs/?/quota"
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
          toaster.success({ title: 'Successfully updated the lab quotas.' });
          break;
        case 'failure':
          toaster.error({ title: 'Failed to update the lab quotas.' });
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="table-container">
    <table class=" table-comfortable table">
      <thead>
        <tr>
          <th>Laboratory</th>
          <th class="table-cell-fit">Quota ({total})</th>
        </tr>
      </thead>
      <tbody>
        {#each labs as { id, name, quota } (id)}
          {@const placeholder = quota.toString()}
          <tr>
            <td class="!align-middle">{name}</td>
            <td class="table-cell-fit"
              ><input
                type="number"
                min="0"
                name={id}
                {placeholder}
                class="input variant-form-material px-2 py-1"
              /></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <button type="submit" class="preset-filled-primary-500 btn w-full">
    <span><Icon src={PencilSquare} class="h-6" /></span>
    <span>Update Lab Quota</span>
  </button>
</form>
