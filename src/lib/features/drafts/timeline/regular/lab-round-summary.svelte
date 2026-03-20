<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';

  import Draftees from '../../draftees/index.svelte';

  import type { Lab } from '$lib/features/drafts/types';

  interface Props {
    draftId: bigint;
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
    <Draftees
      {draftId}
      {lab}
      queryKey={`round-${round}-${lab.name}-members`}
      mustShowDrafted={true}
    >
      {#snippet trigger()}
        <Badge
          variant="outline"
          class="border-primary bg-primary/10 h-fit font-mono text-xs uppercase"
        >
          See Members
        </Badge>
      {/snippet}
    </Draftees>

    <!-- Preferred -->
    <Draftees
      {draftId}
      {round}
      {lab}
      queryKey={`round-${round}-${lab.name}-preferred`}
      mustShowDrafted={false}
    >
      {#snippet trigger()}
        <Badge
          variant="outline"
          class="border-accent bg-accent/10 h-fit font-mono text-xs uppercase"
        >
          See Preferred
        </Badge>
      {/snippet}
    </Draftees>

    <!-- Interested -->
    <Draftees
      {draftId}
      {round}
      {lab}
      queryKey={`round-${round}-${lab.name}-interested`}
      mustShowDrafted={false}
      mustShowInterest={true}
    >
      {#snippet trigger()}
        <Badge
          variant="outline"
          class="border-secondary bg-secondary/10 h-fit font-mono text-xs uppercase"
        >
          See Interested
        </Badge>
      {/snippet}
    </Draftees>
  </div>
</div>
