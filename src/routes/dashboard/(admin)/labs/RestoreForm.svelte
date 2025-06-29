<script lang="ts">
    import { enhance } from "$app/forms";
    import type { schema } from "$lib/server/database";
    import { assert } from "$lib/assert";
    import { useToaster } from "$lib/toast";

    type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota' | 'deletedAt'>;

    interface Props {
        deletedLabs: Lab[]
    }

    const { deletedLabs }: Props = $props();

    const toaster = useToaster();
</script>

<form
  method="post"
  action="/dashboard/labs/?/restore"
  class="space-y-4"
  use:enhance={({ submitter, formData }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    const [restoreElement, labId] = submitter.id.split(':');
    assert(restoreElement === 'restore');
    assert(typeof labId !== 'undefined');
    formData.append('restore', labId);
    let successMessage = `Successfully restored the lab with id: ${labId}`;
    let errorMessage = `Failed to restore the lab with id: ${labId}`;
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
            <th class="table-cell-fit">Restore</th>
            </tr>
        </thead>
        <tbody>
            {#each deletedLabs as { id, name, deletedAt } (id)}
            <tr>
                <td class="!align-middle">
                {name}
                </td>
                <td class="table-cell-fit">
                    <button
                        type="submit"
                        class="preset-filled-warning-500 btn w-full"
                        id="restore:{id}">Restore</button
                    >
                </td>
            </tr>
            {/each}
        </tbody>
        </table>
    </div>
</form>