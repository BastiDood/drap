<script lang="ts">
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota' | 'deletedAt'>;

  interface Props {
    deletedLabs: Lab[];
  }

  const { deletedLabs }: Props = $props();

  const toaster = useToaster();
</script>

<div class="table-container">
  <table class=" table-comfortable table">
    <thead>
      <tr>
        <th>Laboratory</th>
        <th>Deleted at</th>
        <th class="table-cell-fit">Restore</th>
      </tr>
    </thead>
    <tbody>
      {#each deletedLabs as { id, name, deletedAt } (id)}
        {@const deleteDate = deletedAt?.toLocaleDateString()}
        <tr>
          <td class="!align-middle">
            {name}
          </td>
          <td class="table-cell-fit">
            {deleteDate}
          </td>
          <td class="table-cell-fit">
            <form
              method="post"
              action="/dashboard/labs/?/restore"
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
                      toaster.success({ title: `Successfully restored ${name} (${id})` });
                      break;
                    case 'failure':
                      toaster.error({ title: `Failed to restore ${name} (${id})` });
                      break;
                    default:
                      break;
                  }
                };
              }}
            >
              <input type="hidden" name="restore" value={id} />
              <button type="submit" class="preset-filled-warning-500 btn w-full" id="restore:{id}"
                >Restore</button
              >
            </form>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="2">
            <em class="text-surface-400">No deleted labs to restore</em>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
