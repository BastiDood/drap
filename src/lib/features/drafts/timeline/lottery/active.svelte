<script lang="ts">
  import Draftees from '$lib/features/drafts/draftees/index.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { DraftFinalizedBreakdown, Lab } from '$lib/features/drafts/types';

  import ConcludeForm from './conclude-form.svelte';

  import LotterySection from './lottery-section/index.svelte';

  interface Props {
    draftId: bigint;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftFinalizedBreakdown['snapshots'];
  }

  const { draftId, labs, snapshots }: Props = $props();
</script>

<div>
  <div class="prose dark:prose-invert">
    <h3>Lottery Phase</h3>
    <p>
      The final active stage is the lottery phase, where remaining undrafted students are prepared
      for random assignment. Before randomization runs, administrators get one last chance to
      manually intervene.
    </p>
    <ul>
      <li>
        The <strong>"Eligible for Lottery"</strong> section features a list of the remaining
        undrafted students. Administrators may negotiate with the lab heads on how to manually
        assign and distribute these students fairly among interested labs.

        <div class="flex justify-center">
          <!-- Eligible for Lottery -->
          <LotterySection {draftId} {labs} {snapshots} />
        </div>
      </li>
      <li>
        Meanwhile, the <strong>"Already Drafted"</strong> section features an <em>immutable</em>
        list of students who have already been drafted into their respective labs. These are considered
        final.

        <div class="flex justify-center">
          <!-- Already Drafted -->
          <Draftees draftId={draftId.toString()} mustShowDrafted>
            {#snippet trigger(props)}
              <Button variant="outline" class="border-primary text-primary" {...props}
                >Already Drafted</Button
              >
            {/snippet}
          </Draftees>
        </div>
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

    <ConcludeForm {draftId} />
  </div>
</div>
