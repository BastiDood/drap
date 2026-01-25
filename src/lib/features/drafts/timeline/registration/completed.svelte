<script lang="ts">
  import type { Student } from '$lib/features/drafts/types';

  import StudentList from './student-list.svelte';

  interface Props {
    students: Student[];
  }

  const { students }: Props = $props();
</script>

<div class="space-y-4">
  <div class="prose dark:prose-invert">
    <p>
      <strong>{students.length}</strong> students registered for this draft before registration closed.
    </p>
  </div>
  <StudentList {students} />
</div>
