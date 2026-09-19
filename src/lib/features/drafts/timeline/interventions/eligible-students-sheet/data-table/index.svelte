<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import type { Lab, Student } from '$lib/features/drafts/types';
  import { createTable, FlexRender } from '@tanstack/svelte-table';

  import { columns, features } from './schema';

  interface Props {
    data: Student[];
    labs: Pick<Lab, 'id' | 'name'>[];
  }

  const { data, labs }: Props = $props();

  const table = createTable({
    features,
    columns,
    get data() {
      return data;
    },
    meta: {
      get labs() {
        return labs;
      },
    },
  });

  const headerGroups = $derived(table.getHeaderGroups());
  const { rows } = $derived(table.getRowModel());
</script>

<div class="rounded-sm">
  <Table.Root>
    <Table.Header>
      {#each headerGroups as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head
              colspan={header.colSpan}
              data-hover={header.column.id === 'apply-intervention' ? 'off' : null}
            >
              {#if !header.isPlaceholder}
                <FlexRender {header} />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each rows as row (row.id)}
        <Table.Row>
          {#each row.getAllCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender {cell} />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length}>
            <p class="my-8 text-center text-xl">
              All students for this draft have been drafted. Yippee!
            </p>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
