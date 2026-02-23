<script lang="ts" module>
  import type { ActiveLab } from '$lib/features/labs/types';

  export interface Props {
    labs: ActiveLab[];
  }
</script>

<script lang="ts">
  import * as Table from '$lib/components/ui/table';

  import ArchiveForm from './archive-form.svelte';

  const { labs }: Props = $props();
</script>

<div class="space-y-4">
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-full">Laboratory</Table.Head>
          <Table.Head class="w-0 text-right">Archive?</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each labs as { id, name } (id)}
          <Table.Row>
            <Table.Cell class="w-full">{name}</Table.Cell>
            <Table.Cell class="w-0 text-right">
              <ArchiveForm labId={id} />
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={2} class="text-muted-foreground py-8 text-center">
              No active labs found.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
