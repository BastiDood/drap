<script lang="ts">
  import Student from '$lib/users/student.svelte';

  import type { Student as StudentType } from '$lib/features/drafts/types';

  interface Props {
    students: StudentType[];
  }

  const { students }: Props = $props();
</script>

<nav class="w-full">
  <ul class="space-y-1">
    {#each students as { id, ...user } (id)}
      <li><Student {user} /></li>
    {:else}
      <li class="text-muted-foreground py-4 text-center text-sm">
        No students have registered yet.
      </li>
    {/each}
  </ul>
</nav>
