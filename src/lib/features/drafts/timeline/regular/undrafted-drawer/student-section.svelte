<script lang="ts" module>
  import type { Student } from '$lib/features/drafts/types';

  export interface Props {
    title: string;
    description: string;
    selectedCount: number;
    students: Student[];
  }
</script>

<script lang="ts">
  import UndraftedStudentCard from './student-card.svelte';

  const { title, description, selectedCount, students }: Props = $props();
</script>

<section class="space-y-2">
  <h4 class="text-lg font-semibold">{title}</h4>
  <p class="text-sm text-muted-foreground">{description}</p>
  <div class="space-y-2">
    {#if selectedCount === 0}
      <p class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        Select at least one lab to view students.
      </p>
    {:else}
      {#each students as student (student.id)}
        <UndraftedStudentCard {student} />
      {:else}
        <p class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No students matched this filter.
        </p>
      {/each}
    {/if}
  </div>
</section>
