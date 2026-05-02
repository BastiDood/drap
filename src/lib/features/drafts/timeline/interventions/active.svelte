<script lang="ts">
  import ConcludeForm from '$lib/features/drafts/timeline/lottery/conclude-form.svelte';
  import LotterySection from '$lib/features/drafts/timeline/lottery/lottery-section/index.svelte';
  import type {
    DraftLabQuotaSnapshot,
    InterventionsAggregate,
    Lab,
  } from '$lib/features/drafts/types';

  import QuotaDumbbellChart from './quota-dumbbell-chart.svelte';
  import StatCards from './stat-cards.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftLabQuotaSnapshot[];
    interventionsAggregate: InterventionsAggregate;
    isHistorical: boolean;
  }

  const { draftId, labs, snapshots, interventionsAggregate, isHistorical }: Props = $props();
</script>

<div class="@container space-y-4">
  <StatCards data={interventionsAggregate.statCards} {isHistorical} />
  <QuotaDumbbellChart {draftId} rows={interventionsAggregate.dumbbellRows} />
  {#if !isHistorical}
    <div class="prose dark:prose-invert">
      <h3>Interventions Phase</h3>
      <p>
        The final active stage is the interventions phase, where remaining undrafted students are
        prepared for random assignment. Before randomization runs, administrators get one last
        chance to manually intervene.
      </p>
      <ul>
        <li>
          The <strong>"Eligible for Lottery"</strong> section features a list of the remaining
          undrafted students. Administrators may negotiate with the lab heads on how to manually
          assign and distribute these students fairly among interested labs.

          <div class="flex justify-center">
            <LotterySection {draftId} {labs} {snapshots} />
          </div>
        </li>
        <li>
          Meanwhile, the <strong>"Already Drafted"</strong> section features an <em>immutable</em>
          list of students who have already been drafted into their respective labs. These are considered
          final.
        </li>
      </ul>
      <p>
        When ready, administrators can press <strong>"Run Lottery"</strong> to execute randomization.
        The list of students will be shuffled and distributed among labs in round-robin fashion. To uphold
        fairness, uneven distributions should be resolved beforehand.
      </p>
      <p>
        After randomization, the draft enters <strong>Review</strong>. Administrators can inspect
        results before finalization, email dispatch, and official lab assignment.
      </p>
      <ConcludeForm {draftId} />
    </div>
  {/if}
</div>
