<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import { PencilSquare } from '@steeze-ui/heroicons';
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota' | 'deletedAt'>;
  interface Props {
    labs: Lab[];
  }

  const { labs }: Props = $props();
  const total = $derived(labs.reduce((total, { quota, deletedAt }) => total + (deletedAt ? 0 : quota), 0));

  const toaster = useToaster();
</script>

<form
  method="post"
  action="/dashboard/labs/?/quota"
  class="space-y-4"
  use:enhance={({ submitter, formData }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    let successMessage = 'Successfully updated the lab quotas.';
    let errorMessage = 'Failed to update the lab quotas.';
    if (submitter.id.includes('delete:')) {
      const labId = submitter.id.split(':')[1];
      assert(typeof labId != 'undefined');
      formData.append('delete', labId);
      successMessage = `Successfully deleted the lab with id: ${labId}`;
      errorMessage = `Failed to delete the lab with id: ${labId}`;
    } else if (submitter.id.includes('restore:')) {
      const labId = submitter.id.split(':')[1];
      assert(typeof labId != 'undefined');
      formData.append('restore', labId);
      successMessage = `Successfully restored the lab with id: ${labId}`;
      errorMessage = `Failed to restore the lab with id: ${labId}`;
    }
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toaster.success({ title: successMessage });
          break;
        case 'failure':
          toaster.error({ title: errorMessage });
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
          <th class="table-cell-fit">Delete/Restore</th>
        </tr>
      </thead>
      <tbody>
        {#each labs as { id, name, quota, deletedAt } (id)}
          {@const placeholder = quota.toString()}
          <tr>
            <td class="!align-middle">
              {#if deletedAt === null}
                {name}
              {:else}
                <strike>
                  {name}
                </strike>
              {/if}
            </td>
            <td class="table-cell-fit"
              ><input
                type="number"
                min="0"
                name={id}
                {placeholder}
                disabled={deletedAt !== null}
                class="input variant-form-material px-2 py-1"
              /></td
            >
            <td class="table-cell-fit">
              {#if deletedAt === null}
                <button
                  formaction="?/delete"
                  class="preset-filled-error-500 btn w-full"
                  id="delete:{id}">Delete</button
                >
              {:else}
                <button
                  formaction="?/restore"
                  class="preset-filled-warning-500 btn w-full"
                  id="restore:{id}">Restore</button
                >
              {/if}
            </td>
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
