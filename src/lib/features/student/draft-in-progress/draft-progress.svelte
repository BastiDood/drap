<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  import type { schema } from '$lib/server/database';

  export interface Draft extends Pick<schema.Draft, 'maxRounds'> {
    currRound: number;
  }

  interface Props {
    draft: Draft;
  }

  const { draft }: Props = $props();
</script>

<div class="space-y-2">
  <div class="text-muted-foreground flex justify-between text-sm">
    <span>Round {draft.currRound} of {draft.maxRounds}</span>
    <span>{Math.round((draft.currRound / draft.maxRounds) * 100)}%</span>
  </div>
  <Progress max={draft.maxRounds} value={draft.currRound} />
</div>
