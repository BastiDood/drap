<script lang="ts" module>
  import type { ArchivedLab } from '$lib/features/labs/types';

  export interface Props {
    labs: ArchivedLab[];
    disabled?: boolean;
    draftId?: bigint;
  }
</script>

<script lang="ts">
  import { format } from 'date-fns';

  import * as Table from '$lib/components/ui/table';

  import RestoreForm from './form.svelte';

  const { labs, disabled = false, draftId }: Props = $props();
</script>

<div class="rounded-md border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-full">Laboratory</Table.Head>
        <Table.Head class="w-0 text-right">Archived Date</Table.Head>
        <Table.Head class="w-0 text-right" data-hover="off">Restore?</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each labs as { id, name, deletedAt } (id)}
        <Table.Row>
          <Table.Cell class="w-full">{name}</Table.Cell>
          <Table.Cell class="w-0 text-right">
            <span class="text-sm">{format(deletedAt, 'PPP')}</span>
          </Table.Cell>
          <Table.Cell class="w-0 text-right">
            <RestoreForm labId={id} labName={name} {disabled} {draftId} />
          </Table.Cell>
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={3} class="py-8 text-center text-muted-foreground">
            No archived labs found.
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
