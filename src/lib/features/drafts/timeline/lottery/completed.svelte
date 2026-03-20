<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import type { DraftAssignmentRecord } from '$lib/features/drafts/types';

  import Draftees from '../../draftees/index.svelte';

  import FinalizeForm from './finalize-form.svelte';

  interface Props {
    draftId: bigint;
    lotteryDrafted: DraftAssignmentRecord[];
    isReview: boolean;
  }

  const { draftId, lotteryDrafted, isReview }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
  <div class="prose dark:prose-invert">
    <h3>{isReview ? 'Review Phase' : 'Lottery Phase'}</h3>
    {#if isReview}
      <p>
        Lottery assignment has completed. <strong>{lotteryDrafted.length}</strong> students were assigned
        during randomization.
      </p>
      <p>
        Review the results below. When ready, finalize to dispatch emails and synchronize official
        student lab assignments.
      </p>
      <FinalizeForm {draftId} />
    {:else}
      <p>
        The lottery phase has completed. <strong>{lotteryDrafted.length}</strong> students were assigned
        during final lottery randomization.
      </p>
    {/if}
  </div>
  <div class="min-w-max space-y-2">
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>
          {isReview ? 'Lottery Results' : 'Eligible for Lottery'} ({lotteryDrafted.length})
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <p class="prose dark:prose-invert max-w-none">
          {lotteryDrafted.length} students were assigned via lottery.
        </p>
      </Card.Content>
    </Card.Root>
    <div class="flex justify-center">
      <Draftees {draftId} queryKey="lottery-completed" mustShowDrafted={true}>
        {#snippet trigger()}
          <Button variant="outline" class="border-primary text-primary">Already Drafted</Button>
        {/snippet}
      </Draftees>
    </div>
  </div>
</div>
