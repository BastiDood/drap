<script lang="ts">
  import PencilSquareIcon from '@lucide/svelte/icons/pencil';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import type { schema } from '$lib/server/database';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota' | 'deletedAt'>;
  interface Props {
    activeLabs: Lab[];
    isDeleteAllowed: boolean;
  }

  const { activeLabs, isDeleteAllowed }: Props = $props();
  const total = $derived(
    activeLabs.reduce((total, { quota, deletedAt }) => total + (deletedAt ? 0 : quota), 0),
  );
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
      const [deleteElement, labId] = submitter.id.split(':');
      assert(deleteElement === 'delete');
      assert(typeof labId !== 'undefined');
      formData.append('delete', labId);
      successMessage = `Successfully deleted the lab with id: ${labId}`;
      errorMessage = `Failed to delete the lab with id: ${labId}`;
    }
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success(successMessage);
          break;
        case 'failure':
          toast.error(errorMessage);
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="overflow-x-auto rounded-md border">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 border-b">
        <tr>
          <th class="px-4 py-3 text-left font-medium">Laboratory</th>
          <th class="w-32 px-4 py-3 text-left font-medium">Quota ({total})</th>
          {#if isDeleteAllowed}
            <th class="w-24 px-4 py-3 text-left font-medium">Delete</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each activeLabs as { id, name, quota, deletedAt } (id)}
          {@const placeholder = quota.toString()}
          <tr class="border-b">
            <td class="px-4 py-3 align-middle">
              {#if deletedAt === null}
                {name}
              {:else}
                <strike class="text-muted-foreground">{name}</strike>
              {/if}
            </td>
            <td class="w-32 px-4 py-3">
              <Input
                type="number"
                min="0"
                name={id}
                {placeholder}
                disabled={deletedAt !== null}
                class="h-8"
              />
            </td>
            {#if isDeleteAllowed}
              <td class="w-24 px-4 py-3">
                <Button
                  formaction="/dashboard/labs/?/delete"
                  variant="destructive"
                  size="sm"
                  class="w-full"
                  id="delete:{id}"
                >
                  Delete
                </Button>
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <Button type="submit" class="w-full">
    <PencilSquareIcon class="size-5" />
    <span>Update Lab Quota</span>
  </Button>
</form>
