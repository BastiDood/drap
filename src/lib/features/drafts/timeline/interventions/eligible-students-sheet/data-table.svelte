<script lang="ts">
  import {
    createColumnHelper,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
  } from '@tanstack/table-core';

  import * as Table from '$lib/components/ui/table';
  import MultiSelectFilterHeader from '$lib/features/drafts/draftees/multi-select-filter-header.svelte';
  import PreferredLab from '$lib/users/preferred-lab.svelte';
  import SortByHeader from '$lib/features/drafts/draftees/sort-by-header.svelte';
  import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
  import type { Lab, Student } from '$lib/features/drafts/types';

  import ManualLabSelection from './manual-lab-selection.svelte';

  interface Props {
    data: Student[];
    labs: Pick<Lab, 'id' | 'name'>[];
  }

  const { data, labs }: Props = $props();

  // Shape the table columns
  const columnHelper = createColumnHelper<Student>();
  const columns = [
    columnHelper.accessor(({ studentNumber }) => studentNumber, {
      id: 'studentNumber',
      header: header =>
        renderComponent(SortByHeader, {
          header: 'Student Number',
          onclick: header.column.getToggleSortingHandler(),
          sortState: header.column.getIsSorted(),
        }),
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(
      ({ familyName, givenName }) => `${familyName.toUpperCase()}, ${givenName}`,
      {
        id: 'name',
        header: header =>
          renderComponent(SortByHeader, {
            header: 'Name',
            onclick: header.column.getToggleSortingHandler(),
            sortState: header.column.getIsSorted(),
          }),
        cell: info => info.getValue(),
      },
    ),

    columnHelper.accessor(({ email }) => email, {
      id: 'email',
      header: header =>
        renderComponent(SortByHeader, {
          header: 'Email',
          onclick: header.column.getToggleSortingHandler(),
          sortState: header.column.getIsSorted(),
        }),
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(({ labs }) => labs, {
      id: 'labs',
      header(header) {
        const filterValue = header.column.getFilterValue();
        return renderComponent(MultiSelectFilterHeader, {
          header: 'Lab Preferences',
          filtered: header.column.getIsFiltered(),
          onValueChange(values) {
            header.column.setFilterValue(values.length === 0 ? null : values);
          },
          options: Array.from(header.column.getFacetedUniqueValues().entries())
            .filter(([value]) => typeof value === 'string')
            .sort((left, right) => left[0].localeCompare(right[0]))
            .map(([value, count]) => ({ count, value })),
          values: Array.isArray(filterValue)
            ? filterValue.filter(lab => typeof lab === 'string')
            : [],
        });
      },
      cell: info => renderComponent(PreferredLab, { labs: info.getValue() }),
      filterFn: 'arrIncludesSome',
      getUniqueValues: ({ labs }) => labs,
    }),

    columnHelper.accessor(({ id }) => id, {
      id: 'apply-intervention',
      header: 'Apply Intervention?',
      cell: info => renderComponent(ManualLabSelection, { labs, studentId: info.getValue() }),
    }),
  ];

  // This only initializes lazily on load.
  // We put it here so that we don't needlessly initialize state
  // in the `pending` case and the `error` case.
  const table = $derived(
    createSvelteTable({
      data,
      columns,
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    }),
  );

  const headerGroups = $derived(table.getHeaderGroups());
  const { rows } = $derived(table.getRowModel());
</script>

<!-- Table -->
<div class="rounded-sm">
  <Table.Root>
    <!-- Header Row -->
    <Table.Header>
      {#each headerGroups as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head
              colspan={header.colSpan}
              data-hover={header.column.id === 'apply-intervention' ? 'off' : null}
            >
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
      {#each rows as row (row.id)}
        <Table.Row>
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length}>
            <p class="text-center my-8 text-xl">
              All students for this draft have been drafted. Yippee!
            </p>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
