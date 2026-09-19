import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_arrIncludesSome,
  filterFn_equals,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  renderComponent,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
} from '@tanstack/svelte-table';

import DateTime from '$lib/components/date-time.svelte';
import DesignatedLab from '$lib/users/designated-lab.svelte';
import MultiSelectFilterHeader from '$lib/features/drafts/multi-select-filter-header.svelte';
import PreferredLab from '$lib/users/preferred-lab.svelte';
import SortByHeader from '$lib/features/drafts/sort-by-header.svelte';
import type { Student } from '$lib/features/drafts/types';

import LateNameCell from './late-name-cell.svelte';
import SingleSelectFilterHeader from './single-select-filter-header.svelte';

export interface ExtendedStudent extends Student {
  isLate?: boolean;
}

export const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnFacetingFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns: {
    arrIncludesSome: filterFn_arrIncludesSome,
    equals: filterFn_equals,
    equalsString: filterFn_equalsString,
    includesString: filterFn_includesString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
});

const columnHelper = createColumnHelper<typeof features, ExtendedStudent>();

export const columns = columnHelper.columns([
  columnHelper.accessor(({ submittedAt }) => submittedAt, {
    id: 'submittedAt',
    enableGlobalFilter: false,
    header: header =>
      renderComponent(SortByHeader, {
        header: 'Submission Date',
        onclick: header.column.getToggleSortingHandler(),
        sortState: header.column.getIsSorted(),
      }),
    cell: info => renderComponent(DateTime, { date: info.getValue() }),
    sortFn: 'datetime',
  }),
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
    sortFn: 'basic',
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
      cell: info =>
        renderComponent(LateNameCell, {
          isLate: info.row.original.isLate ?? false,
          name: info.getValue(),
        }),
      sortFn: 'alphanumeric',
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
    sortFn: 'alphanumeric',
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
]);
