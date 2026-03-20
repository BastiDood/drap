<script lang="ts">
  import AvailableDraftees from '$lib/features/drafts/draftees/available/index.svelte';
  import DraftedDraftees from '$lib/features/drafts/draftees/drafted/index.svelte';
  import InterestedDraftees from '$lib/features/drafts/draftees/interested/index.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type { Lab } from '$lib/features/drafts/types';

  interface Props {
    draftId: string;
    round: number;
    lab: Lab;
  }

  const { draftId, round, lab }: Props = $props();
</script>

<div class="flex h-12 w-full items-center justify-between border-b pb-1 last:border-0">
  {#if lab.quota === 0}
    <h5 class="text-muted-foreground text-lg font-medium">{lab.name}</h5>
  {:else}
    <div class="flex items-center gap-1">
      <h5 class="text-lg font-medium">{lab.name}</h5>
      <Badge
        variant="outline"
        class="border-warning bg-warning/10 h-fit font-mono text-xs uppercase"
      >
        {lab.quota} maximum
      </Badge>
    </div>
  {/if}
  <div class="flex items-center gap-1">
    <!-- Members -->
    <DraftedDraftees {draftId} {lab} />
    <!-- Preferred -->
    <AvailableDraftees {draftId} {round} {lab} variant="see-preferred" />
    <!-- Interested -->
    <InterestedDraftees {draftId} {round} {lab} />
  </div>
</div>
