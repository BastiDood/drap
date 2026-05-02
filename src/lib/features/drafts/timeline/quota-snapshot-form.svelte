<script lang="ts" module>
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  export interface Props {
    draftId: string;
    mode: 'initial' | 'lottery';
    snapshots: DraftLabQuotaSnapshot[];
    onSuccess?: () => void;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import { toast } from 'svelte-sonner';
  import { useQueryClient } from '@tanstack/svelte-query'; // eslint-disable-line no-restricted-imports

  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const { draftId, mode, snapshots, onSuccess }: Props = $props();
  const queryClient = useQueryClient();

  let isSubmitting = $state(false);
</script>

<form
  id="draft-quota-editor-{mode}"
  method="post"
  action="/dashboard/drafts/{draftId}/?/quota"
  class="flex flex-col gap-4"
  use:enhance={() => {
    isSubmitting = true;
    return async ({ update, result }) => {
      isSubmitting = false;
      await update();
      await queryClient.invalidateQueries({ queryKey: ['drafts', draftId] });
      switch (result.type) {
        case 'success':
          toast.success(
            mode === 'initial'
              ? 'Initial quota snapshots updated.'
              : 'Lottery quota snapshots updated.',
          );
          onSuccess?.();
          break;
        case 'failure':
          toast.error('Failed to update quota snapshots.');
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draftId} />
  <input type="hidden" name="kind" value={mode} />

  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-full">Laboratory</Table.Head>
          <Table.Head class="w-0 text-right">Quota</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each snapshots as { labId, labName, initialQuota, lotteryQuota } (labId)}
          <Table.Row>
            <Table.Cell class="w-full">{labName}</Table.Cell>
            <Table.Cell class="w-0">
              {@const quotaInputId = `quota-input-${mode}-${labId}`}
              {@const committedQuota = mode === 'initial' ? initialQuota : lotteryQuota}
              <Label for={quotaInputId} class="sr-only">Quota for {labName}</Label>
              <Input
                id={quotaInputId}
                name={labId}
                type="number"
                min="0"
                placeholder={committedQuota.toString()}
                class="h-8 min-w-24 text-right"
              />
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <Button type="submit" variant="default" class="w-full" disabled={isSubmitting}>
    {#if isSubmitting}
      <Loader2Icon class="size-4 animate-spin" />
    {:else}
      {mode === 'initial' ? 'Update Initial Snapshots' : 'Update Lottery Snapshots'}
    {/if}
  </Button>
</form>
