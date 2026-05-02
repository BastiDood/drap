<script lang="ts">
  import {
    createColumnHelper,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
  } from '@tanstack/table-core';
  import type { Snippet } from 'svelte';

  import * as Table from '$lib/components/ui/table';
  import DesignatedLab from '$lib/users/designated-lab.svelte';
  import PreferredLab from '$lib/users/preferred-lab.svelte';
  import { Button } from '$lib/components/ui/button';
  import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
  import { Input } from '$lib/components/ui/input';
  import type { Student } from '$lib/features/drafts/types';

  import LateNameCell from './late-name-cell.svelte';
  import MultiSelectFilterHeader from './multi-select-filter-header.svelte';
  import SingleSelectFilterHeader from './single-select-filter-header.svelte';
  import SortByHeader from './sort-by-header.svelte';

  interface ExtendedStudent extends Student {
    isLate?: boolean;
  }

  interface Props {
    data: ExtendedStudent[];
    children?: Snippet;
    variant?: 'default' | 'registration-sheet';
  }

  const { data, children, variant }: Props = $props();

  // Shape the table columns
  const columnHelper = createColumnHelper<ExtendedStudent>();
  const columns = [
    columnHelper.accessor(({ studentNumber }) => studentNumber, {
      id: 'studentNumber',
      enableGlobalFilter: false,
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
        cell: ({ getValue, row }) =>
          renderComponent(LateNameCell, { isLate: row.original.isLate ?? false, name: getValue() }),
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
    columnHelper.accessor(({ labId }) => labId, {
      id: 'labId',
      enableGlobalFilter: false,
      header(header) {
        const filterValue = header.column.getFilterValue();
        return renderComponent(SingleSelectFilterHeader, {
          header: 'Designated Lab',
          filtered: header.column.getIsFiltered(),
          onValueChange(value) {
            header.column.setFilterValue(value === '' ? null : value);
          },
          options: Array.from(header.column.getFacetedUniqueValues().entries())
            .filter(([value]) => typeof value === 'string')
            .sort((left, right) => left[0].localeCompare(right[0]))
            .map(([value, count]) => ({ count, value })),
          value: typeof filterValue === 'string' ? filterValue : '',
        });
      },
      cell: info => renderComponent(DesignatedLab, { labId: info.getValue() }),
      filterFn: 'equalsString',
    }),
    columnHelper.accessor(({ labs }) => labs, {
      id: 'labs',
      enableGlobalFilter: false,
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
    columnHelper.accessor(({ isLate }) => isLate ?? false, {
      id: 'isLate',
      enableGlobalFilter: false,
      header: 'Late',
      filterFn: 'equals',
      cell: info => info.getValue(),
    }),
  ];

  // This only initializes lazily on load.
  // We put it here so that we don't needlessly initialize state
  // in the `pending` case and the `error` case.
  const table = $derived(
    createSvelteTable({
      data,
      columns,
      initialState: {
        columnVisibility: {
          isLate: false,
        },
      },
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    }),
  );

  const headerGroups = $derived(table.getHeaderGroups());
  const rows = $derived(table.getRowModel().rows);
  const visibleColumnCount = $derived(table.getVisibleLeafColumns().length);
  const globalFilter = $derived.by(() => {
    const value = table.getState().globalFilter;
    return typeof value === 'string' ? value : '';
  });
  const lateOnly = $derived(table.getColumn('isLate')?.getFilterValue() === true);
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
            <Table.Cell colspan={visibleColumnCount}>
              {#if variant === 'registration-sheet'}
                <div class="my-8">{@render children?.()}</div>
              {:else}
                <p class="text-center my-8 text-xl empty:hidden">{@render children?.()}</p>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
