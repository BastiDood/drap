<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Student from '$lib/users/student.svelte';

  import type { Lab, Student as StudentType } from '$lib/features/drafts/types';

  import ConcludeForm from './conclude-form.svelte';
  import InterveneForm from './intervene-form.svelte';

  interface Props {
    draftId: bigint;
    labs: Pick<Lab, 'id' | 'name'>[];
    available: StudentType[];
    selected: StudentType[];
    isActive: boolean;
  }

  const { draftId, labs, available, selected, isActive }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
  <div class="prose dark:prose-invert">
    <h3>Lottery Phase</h3>
    {#if isActive}
      <p>
        The final stage is the lottery phase, where the remaining undrafted students are randomly
        assigned to their labs. Before the system automatically randomizes anything, administrators
        are given a final chance to manually intervene with the draft results.
      </p>
      <ul>
        <li>
          The <strong>"Eligible for Lottery"</strong> section features a list of the remaining undrafted
          students. Administrators may negotiate with the lab heads on how to manually assign and distribute
          these students fairly among interested labs.
        </li>
        <li>
          Meanwhile, the <strong>"Already Drafted"</strong> section features an <em>immutable</em> list
          of students who have already been drafted into their respective labs. These are considered final.
        </li>
      </ul>
      <p>
        When ready, administrators can press the <strong>"Conclude Draft"</strong> button to proceed with
        the randomization stage. The list of students will be randomly shuffled and distributed among
        the labs in a round-robin fashion. To uphold fairness, it is important that uneven distributions
        are manually resolved beforehand.
      </p>
      <p>
        After the randomization stage, the draft process is officially complete. All students, lab
        heads, and administrators are notified of the final results.
      </p>
      <ConcludeForm {draftId} />
    {:else}
      <p>
        The lottery phase has completed. <strong>{available.length}</strong> students were in the lottery
        pool and have been assigned to labs.
      </p>
    {/if}
  </div>
  <div class="min-w-max space-y-2">
    <Card.Root class="border-warning bg-warning/10">
      <Card.Header>
        <Card.Title>Eligible for Lottery ({available.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        {#if isActive}
          {#if available.length > 0}
            <InterveneForm {draftId} {labs} students={available} />
          {:else}
            <p class="prose dark:prose-invert max-w-none">
              Congratulations! All participants have been drafted. No action is needed here.
            </p>
          {/if}
        {:else}
          <p class="prose dark:prose-invert max-w-none">
            {available.length} students were assigned via lottery.
          </p>
        {/if}
      </Card.Content>
    </Card.Root>
    <Card.Root class="border-success bg-success/10">
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
