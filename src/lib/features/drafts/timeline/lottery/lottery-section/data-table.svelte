<script lang="ts">
  import { type ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type SortingState } from '@tanstack/table-core';

  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Table from '$lib/components/ui/table';
  import PreferredLab from '$lib/users/preferred-lab.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
  import type { Lab, Student } from '$lib/features/drafts/types';

  import SortByHeader from '../../../draftees/sort-by-header.svelte';

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
        }),
      cell: info => info.getValue(),
    }),

    columnHelper.accessor(({ labs }) => labs, {
      id: 'labs',
      header: 'Lab Preferences',
      cell: info => renderComponent(PreferredLab, { labs: info.getValue() }),
      filterFn: 'arrIncludesSome',
    }),

    columnHelper.accessor(({ id }) => id, {
      id: 'apply-intervention',
      header: 'Apply Intervention?',
      cell: info => renderComponent(ManualLabSelection, { labs, studentId: info.getValue() }),
    }),
  ];

  // Store table states
  let sorting: SortingState = $state([]);
  let columnFilters: ColumnFiltersState = $state([]);

  // Get all possible labs for filtering
  const preferredLabFilters = $derived([...new Set(data.flatMap(({ labs }) => labs))]);
  $effect(() => {
    preferredLabFilters.sort();
  });
  let preferredLabFilterValues: string[] = $state([]);

  // This only initializes lazily on load.
  // We put it here so that we don't needlessly initialize state
  // in the `pending` case and the `error` case.
  const table = $derived(
    createSvelteTable({
      data,
      columns,

      // Normal state
      getCoreRowModel: getCoreRowModel(),

      // Sorted state
      getSortedRowModel: getSortedRowModel(),
      onSortingChange(updater) {
        sorting = typeof updater === 'function' ? updater(sorting) : updater;
      },

      // Filtered state
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange(updater) {
        columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      },

      // List of table states
      state: {
        sorting,
        columnFilters,
      },
    }),
  );
</script>

<!-- Filter Buttons -->
<div class="mx-4 mb-4 flex items-center justify-end gap-2">
  <!-- Lab Preferences -->
  {#if preferredLabFilters.length > 0}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          variant="outline"
          class={preferredLabFilterValues.length === 0 ? '' : 'border-secondary text-secondary'}
        >
          Lab Preference: {preferredLabFilterValues.length === 0 ||
          preferredLabFilterValues.length === preferredLabFilters.length
            ? 'All'
            : preferredLabFilterValues.map(lab => lab.toUpperCase()).join(', ')}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onclick={() => {
            preferredLabFilterValues = [];
            table.getColumn('labs')?.setFilterValue(preferredLabFilterValues);
          }}
        >
          Clear Filters
        </DropdownMenu.Item>
        {#each preferredLabFilters as filter}
          <DropdownMenu.Item
            onclick={() => {
              if (preferredLabFilterValues.includes(filter))
                preferredLabFilterValues = preferredLabFilterValues.filter(lab => lab !== filter);
              else preferredLabFilterValues.push(filter);
              table.getColumn('labs')?.setFilterValue(preferredLabFilterValues);
            }}
          >
            {#if preferredLabFilterValues.includes(filter)}
              <Badge variant="outline" class="border-primary bg-primary/10 mr-1 text-xs uppercase">
                {filter.toUpperCase()}
              </Badge>
            {:else}
              <Badge variant="outline" class="border-muted bg-muted/10 mr-1 text-xs uppercase">
                {filter.toUpperCase()}
              </Badge>
            {/if}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>

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
