<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import { createTable, FlexRender } from '@tanstack/svelte-table';
  import type { Snippet } from 'svelte';

  import { columns, type ExtendedStudent, features } from './schema';

  interface Props {
    data: ExtendedStudent[];
    children?: Snippet;
    variant?: 'default' | 'registration-sheet';
  }

  const { data, children, variant }: Props = $props();

  const table = createTable({
    features,
    columns,
    get data() {
      return data;
    },
    initialState: {
      columnVisibility: {
        isLate: false,
      },
    },
  });

  const headerGroups = $derived(table.getHeaderGroups());
  const rows = $derived(table.getRowModel().rows);
  const visibleColumnCount = $derived(table.getVisibleLeafColumns().length);
  const globalFilter = $derived.by(() => {
    const value = table.atoms.globalFilter.get();
    return typeof value === 'string' ? value : '';
  });
  const lateOnly = $derived(
    table.atoms.columnFilters.get().some(({ id, value }) => id === 'isLate' && value === true),
  );
</script>

<div class="flex min-h-0 grow flex-col gap-4">
  {#if variant === 'registration-sheet'}
    <div class="flex shrink-0 gap-2">
      <Input
        placeholder="Search students..."
        value={globalFilter}
        oninput={event => {
          table.setGlobalFilter(
            event.currentTarget.value === '' ? null : event.currentTarget.value,
          );
        }}
        class="flex-1"
      />
      <Button
        variant={lateOnly ? 'secondary' : 'outline'}
        onclick={() => {
          table.getColumn('isLate')?.setFilterValue(lateOnly ? null : true);
        }}
      >
        Late Only
      </Button>
    </div>
  {/if}

  <div class="min-h-0 grow overflow-y-auto rounded-sm">
    <Table.Root>
      <Table.Header>
        {#each headerGroups as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
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
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender {cell} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={visibleColumnCount}>
              {#if variant === 'registration-sheet'}
                <div class="my-8">{@render children?.()}</div>
              {:else}
                <p class="my-8 text-center text-xl empty:hidden">{@render children?.()}</p>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
