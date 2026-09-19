import {
  columnFacetingFeature,
  columnFilteringFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_arrIncludesSome,
  metaHelper,
  renderComponent,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
} from '@tanstack/svelte-table';

import DateTime from '$lib/components/date-time.svelte';
import MultiSelectFilterHeader from '$lib/features/drafts/multi-select-filter-header.svelte';
import PreferredLab from '$lib/users/preferred-lab.svelte';
import SortByHeader from '$lib/features/drafts/sort-by-header.svelte';
import type { Lab, Student } from '$lib/features/drafts/types';

import ManualLabSelection from './manual-lab-selection.svelte';

export interface EligibleStudentsTableMeta {
  labs: Pick<Lab, 'id' | 'name'>[];
}

export const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  rowSortingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { arrIncludesSome: filterFn_arrIncludesSome },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
  tableMeta: metaHelper<EligibleStudentsTableMeta>(),
});

const columnHelper = createColumnHelper<typeof features, Student>();

export const columns = columnHelper.columns([
  columnHelper.accessor(({ submittedAt }) => submittedAt, {
    id: 'submittedAt',
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
      cell: info => info.getValue(),
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
    cell(info) {
      const labs = info.table.options.meta?.labs;
      if (typeof labs === 'undefined') throw new Error('Eligible students table requires labs.');

      return renderComponent(ManualLabSelection, { labs, studentId: info.getValue() });
    },
  }),
]);
