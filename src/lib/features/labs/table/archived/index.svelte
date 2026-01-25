<script lang="ts" module>
  import type { ArchivedLab } from '$lib/features/labs/types';

  export interface Props {
    labs: ArchivedLab[];
    hasActiveDraft: boolean;
  }
</script>

<script lang="ts">
  import { format } from 'date-fns';

  import * as Table from '$lib/components/ui/table';

  import RestoreForm from './form.svelte';

  const { labs, hasActiveDraft }: Props = $props();
  const isRestoreAllowed = $derived(!hasActiveDraft);
</script>

<div class="rounded-md border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Laboratory</Table.Head>
        <Table.Head>Archived Date</Table.Head>
        {#if isRestoreAllowed}
          <Table.Head>Restore?</Table.Head>
        {/if}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each labs as { id, name, deletedAt } (id)}
        <Table.Row>
          <Table.Cell>{name}</Table.Cell>
          <Table.Cell>
            <span class="text-sm">{format(deletedAt, 'PPP')}</span>
          </Table.Cell>
          {#if isRestoreAllowed}
            <Table.Cell>
              <RestoreForm labId={id} labName={name} />
            </Table.Cell>
          {/if}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell
            colspan={isRestoreAllowed ? 3 : 2}
            class="text-muted-foreground py-8 text-center"
          >
            No archived labs found.
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
