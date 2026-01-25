<script lang="ts" module>
  import type { ActiveLab } from '$lib/features/labs/types';

  export interface Props {
    labs: ActiveLab[];
    hasActiveDraft: boolean;
  }
</script>

<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';

  import ArchiveForm from './archive-form.svelte';
  import UpdateForm from './update-form.svelte';

  const { labs, hasActiveDraft }: Props = $props();

  const formId = $props.id();
  const total = $derived(labs.reduce((sum, { quota }) => sum + quota, 0));
  const isEditable = $derived(!hasActiveDraft);
</script>

<div class="space-y-4">
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-full">Laboratory</Table.Head>
          <Table.Head class="w-0 text-right"
            >Quota <Badge variant="outline">{total}</Badge></Table.Head
          >
          {#if isEditable}
            <Table.Head class="w-0 text-right">Archive?</Table.Head>
          {/if}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each labs as { id, name, quota } (id)}
          <Table.Row>
            <Table.Cell class="w-full">{name}</Table.Cell>
            <Table.Cell class="w-0 text-right">
              {#if isEditable}
                <Input
                  type="number"
                  min="0"
                  name={id}
                  placeholder={quota.toString()}
                  form={formId}
                  class="h-8"
                />
              {:else}
                <Badge variant="secondary">{quota}</Badge>
              {/if}
            </Table.Cell>
            {#if isEditable}
              <Table.Cell class="w-0 text-right">
                <ArchiveForm labId={id} />
              </Table.Cell>
            {/if}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={isEditable ? 3 : 2} class="text-muted-foreground py-8 text-center">
              No active labs found.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
  {#if isEditable}
    <div class="flex justify-end">
      <UpdateForm id={formId} />
    </div>
  {/if}
</div>
