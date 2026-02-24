<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Student from '$lib/users/student.svelte';

  import type { DraftAssignmentRecord, Student as StudentType } from '$lib/features/drafts/types';

  interface Props {
    selected: StudentType[];
    lotteryDrafted: DraftAssignmentRecord[];
  }

  const { selected, lotteryDrafted }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
  <div class="prose dark:prose-invert">
    <h3>Lottery Phase</h3>
    <p>
      The lottery phase has completed. <strong>{lotteryDrafted.length}</strong> students were assigned
      during final lottery randomization.
    </p>
  </div>
  <div class="min-w-max space-y-2">
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Eligible for Lottery ({lotteryDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <p class="prose dark:prose-invert max-w-none">
          {lotteryDrafted.length} students were assigned via lottery.
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Already Drafted ({selected.length})</Card.Title>
      </Card.Header>
      <Card.Content>
        <ul class="space-y-1">
          {#each selected as { id, ...user } (id)}
            <li><Student {user} /></li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>
  </div>
</div>
