<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Student from '$lib/users/student.svelte';

  import type { Student as StudentType } from '$lib/features/drafts/types';

  interface Props {
    available: StudentType[];
    selected: StudentType[];
  }

  const { available, selected }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
  <div class="prose dark:prose-invert">
    <h3>Lottery Phase</h3>
    <p>
      The lottery phase has completed. <strong>{available.length}</strong> students were in the lottery
      pool and have been assigned to labs.
    </p>
  </div>
  <div class="min-w-max space-y-2">
    <Card.Root class="bg-muted border-0">
      <Card.Header>
        <Card.Title>Eligible for Lottery ({available.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <p class="prose dark:prose-invert max-w-none">
          {available.length} students were assigned via lottery.
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root class="bg-muted border-0">
      <Card.Header>
        <Card.Title>Already Drafted ({selected.length})</Card.Title>
      </Card.Header>
      <Card.Content>
        <ul class="space-y-1">
          {#each selected as { id, ...user } (id)}
            <li class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150">
              <Student {user} />
            </li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>
  </div>
</div>
