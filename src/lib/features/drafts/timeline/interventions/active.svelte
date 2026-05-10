<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  import * as Alert from '$lib/components/ui/alert';
  import ConcludeForm from '$lib/features/drafts/timeline/lottery/conclude-form.svelte';
  import type { DraftLabQuotaSnapshot, DumbbellRow, Lab } from '$lib/features/drafts/types';

  import QuotaDumbbellChart from './quota-dumbbell-chart.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftLabQuotaSnapshot[];
    rows: DumbbellRow[];
    isHistorical: boolean;
  }

  const { draftId, labs, snapshots, rows, isHistorical }: Props = $props();
</script>

<div class="@container space-y-4">
  {#if !isHistorical}
    <Alert.Root variant="success" class="grid-cols-[auto_1fr_auto] items-center gap-x-3">
      <SparklesIcon class="text-success" />
      <Alert.Title>Ready for Lottery</Alert.Title>
      <Alert.Description>
        Run lottery after confirming the eligible student pool and final lottery quotas.
      </Alert.Description>
      <div class="col-start-2 mt-2 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0">
        <ConcludeForm {draftId} />
      </div>
    </Alert.Root>
  {/if}
  <QuotaDumbbellChart {draftId} {labs} {snapshots} {rows} {isHistorical} />
</div>
