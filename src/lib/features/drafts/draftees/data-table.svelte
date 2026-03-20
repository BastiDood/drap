<script lang="ts">
  import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type ColumnFiltersState, type SortingState } from '@tanstack/table-core';

  import * as Table from '$lib/components/ui/table';
  import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';

  import type { Student } from '$lib/features/drafts/types';
  import SortByHeader from './sort-by-header.svelte';

  interface Props {
    data: Student[];
    customTextOnEmpty?: string;
  }

  const { data, customTextOnEmpty }: Props = $props();

  // Shape the table columns
  const columnHelper = createColumnHelper<Student>();
  const columns = [
    columnHelper.accessor(({ studentNumber }) => studentNumber, {
      id: 'studentNumber',
      header: header => renderComponent(SortByHeader, {
        header: 'Student Number',
        onclick: header.column.getToggleSortingHandler(),
      }),
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(({ familyName, givenName }) => `${familyName.toUpperCase()}, ${givenName}`, {
      id: 'name',
      header: header => renderComponent(SortByHeader, {
        header: 'Name',
        onclick: header.column.getToggleSortingHandler(),
      }),
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(({ email }) => email, {
      id: 'email',
      header: header => renderComponent(SortByHeader, {
        header: 'Email',
        onclick: header.column.getToggleSortingHandler(),
      }),
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(({ labId }) => labId, {
      id: 'labId',
      header: 'Designated Lab',
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(({ labs }) => labs, {
      id: 'labs',
      header: 'Lab Preferences',
      cell: info => info.getValue(),
    }),
  ];

  // Store table states
  let sorting: SortingState = $state([]);
  let columnFilters: ColumnFiltersState = $state([]);

  // This only initializes lazily on load.
  // We put it here so that we don't needlessly initialize state
  // in the `pending` case and the `error` case.
  const table = $derived(createSvelteTable({
    data,
    columns,

    // Normal state
    getCoreRowModel: getCoreRowModel(),

    // Sorted state
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    
    // Filtered state
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: (updater) => {
      columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
    },

    // List of table states
    state: {
      sorting,
      columnFilters,
    }
  }));
</script>

<!-- Table -->
<div class="mx-4 rounded-sm">
  <Table.Root>
    <!-- Header Row -->
    <Table.Header>
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head colspan={header.colSpan}>
              {#if !header.isPlaceholder}
                <FlexRender
                  content={header.column.columnDef.header}
                  context={header.getContext()}
                />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>

    <!-- Table Rows -->
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row>
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender
                content={cell.column.columnDef.cell}
                context={cell.getContext()}
              />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length}>
            <p class="text-center my-8 text-xl">{customTextOnEmpty ?? ''}</p>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
