<script lang="ts" module>
  import type { Student } from '$lib/features/drafts/types';

  export interface ExtendedStudent extends Student {
    isLate: boolean;
  }

  export interface Props {
    students: ExtendedStudent[];
  }
</script>

<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';

  import DataTable from '$lib/features/drafts/draftees/data-table.svelte';
  import Empty from '$lib/components/empty.svelte';

  const { students }: Props = $props();
</script>

<DataTable data={students} variant="registration-sheet">
  <Empty media={{ icon: UsersIcon, size: 'sm' }} class="min-h-40 grow">
    {#snippet title()}No Matching Draftees{/snippet}
    {#snippet description()}Adjust the search or turn off the late-only filter.{/snippet}
  </Empty>
</DataTable>
