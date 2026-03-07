<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Student from '$lib/users/student.svelte';
  import type {
    DraftFinalizedBreakdown,
    Lab,
    Student as StudentType,
  } from '$lib/features/drafts/types';

  import QuotaSnapshotForm from '../quota-snapshot-form.svelte';

  import ConcludeForm from './conclude-form.svelte';
  import InterveneForm from './intervene-form.svelte';

  interface Props {
    draftId: bigint;
    labs: Pick<Lab, 'id' | 'name'>[];
    available: StudentType[];
    selected: StudentType[];
    snapshots: DraftFinalizedBreakdown['snapshots'];
  }

  const { draftId, labs, available, selected, snapshots }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
  <div class="prose dark:prose-invert">
    <h3>Lottery Phase</h3>
    <p>
      The final active stage is the lottery phase, where remaining undrafted students are prepared
      for random assignment. Before randomization runs, administrators get one last chance to
      manually intervene.
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
      When ready, administrators can press <strong>"Run Lottery"</strong> to execute randomization. The
      list of students will be shuffled and distributed among labs in round-robin fashion. To uphold fairness,
      uneven distributions should be resolved beforehand.
    </p>
    <p>
      After randomization, the draft enters <strong>Review</strong>. Administrators can inspect
      results before finalization, email dispatch, and official lab assignment.
    </p>
    <QuotaSnapshotForm {draftId} mode="lottery" {snapshots} />
    <ConcludeForm {draftId} />
  </div>
  <div class="min-w-max space-y-2">
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Eligible for Lottery ({available.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        {#if available.length > 0}
          <InterveneForm {draftId} {labs} students={available} />
        {:else}
          <p class="prose dark:prose-invert max-w-none">
            Congratulations! All participants have been drafted. No action is needed here.
          </p>
        {/if}
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
