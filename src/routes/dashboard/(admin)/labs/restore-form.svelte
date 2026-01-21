<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota' | 'deletedAt'>;

  interface Props {
    deletedLabs: Lab[];
  }

  const { deletedLabs }: Props = $props();
</script>

<div class="overflow-x-auto rounded-md border">
  <table class="w-full text-sm">
    <thead class="bg-muted/50 border-b">
      <tr>
        <th class="px-4 py-3 text-left font-medium">Laboratory</th>
        <th class="px-4 py-3 text-left font-medium">Deleted at</th>
        <th class="w-24 px-4 py-3 text-left font-medium">Restore</th>
      </tr>
    </thead>
    <tbody>
      {#each deletedLabs as { id, name, deletedAt } (id)}
        {@const deleteDate = deletedAt?.toLocaleDateString()}
        <tr class="border-b">
          <td class="px-4 py-3 align-middle">
            {name}
          </td>
          <td class="px-4 py-3">
            {deleteDate}
          </td>
          <td class="w-24 px-4 py-3">
            <form
              method="post"
              action="/dashboard/labs/?/restore"
              use:enhance={({ submitter }) => {
                assert(submitter !== null);
                assert(submitter instanceof HTMLButtonElement);
                submitter.disabled = true;
                return async ({ update, result }) => {
                  submitter.disabled = false;
                  await update();
                  switch (result.type) {
                    case 'success':
                      toast.success(`Successfully restored ${name} (${id})`);
                      break;
                    case 'failure':
                      toast.error(`Failed to restore ${name} (${id})`);
                      break;
                    default:
                      break;
                  }
                };
              }}
            >
              <input type="hidden" name="restore" value={id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                class="border-warning text-warning hover:bg-warning/10 w-full"
                id="restore:{id}"
              >
                Restore
              </Button>
            </form>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="3" class="px-4 py-3">
            <em class="text-muted-foreground">No deleted labs to restore</em>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
