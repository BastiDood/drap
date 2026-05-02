<script lang="ts" module>
  import type { Student } from '$lib/features/drafts/types';

  export interface Props {
    draftees: Student[];
    lateRegistrants: Student[];
  }
</script>

<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
  import { SvelteMap } from 'svelte/reactivity';

  import Empty from '$lib/components/empty.svelte';

  import DrafteesSheetTable from './table.svelte';

  const { draftees, lateRegistrants }: Props = $props();
  type StudentRecord = Props['draftees'][number];

  const students = $derived.by(() => {
    const lateIds = new Set(lateRegistrants.map(student => student.id));
    const studentsById = new SvelteMap<string, StudentRecord>();

    for (const student of draftees) studentsById.set(student.id, student);
    for (const student of lateRegistrants)
      if (!studentsById.has(student.id)) studentsById.set(student.id, student);

    return Array.from(studentsById.values()).map(student => ({
      ...student,
      isLate: lateIds.has(student.id),
    }));
  });
</script>

{#if students.length > 0}
  <DrafteesSheetTable {students} />
{:else}
  <Empty media={{ icon: UsersIcon, size: 'sm' }}>
    {#snippet title()}No Draftees Yet{/snippet}
    {#snippet description()}Registered and late draftees will appear here once available.{/snippet}
  </Empty>
{/if}
