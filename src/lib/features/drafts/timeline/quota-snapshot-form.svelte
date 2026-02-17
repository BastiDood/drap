<script lang="ts" module>
  import type { DraftConcludedBreakdown } from '$lib/features/drafts/types';

  export interface Props {
    draftId: bigint;
    mode: 'initial' | 'lottery';
    snapshots: DraftConcludedBreakdown['snapshots'];
  }
</script>

<script lang="ts">
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const { draftId, mode, snapshots }: Props = $props();

  const title = $derived(
    mode === 'initial' ? 'Initial Quota Snapshots' : 'Lottery Quota Snapshots',
  );
  const description = $derived(
    mode === 'initial'
      ? 'These values are used during regular rounds and are isolated from global lab quota settings.'
      : 'These values are used when concluding lottery assignments for this draft only.',
  );
</script>

<Card.Root id={`draft-quota-editor-${mode}`} class="border-0">
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    <Card.Description>{description}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="post"
      action="/dashboard/drafts/{draftId}/?/quota"
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
              toast.success(
                mode === 'initial'
                  ? 'Initial quota snapshots updated.'
                  : 'Lottery quota snapshots updated.',
              );
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
                  <Label for={quotaInputId} class="sr-only">Quota for {labName}</Label>
                  <Input
                    id={quotaInputId}
                    name={labId}
                    type="number"
                    min="0"
                    value={mode === 'initial' ? initialQuota : lotteryQuota}
                    class="h-8 min-w-24 text-right"
                  />
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <div class="flex justify-end">
        <Button type="submit" variant="outline">
          {mode === 'initial' ? 'Update Initial Snapshots' : 'Update Lottery Snapshots'}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
