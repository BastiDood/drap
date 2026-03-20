<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import Draftees from '$lib/features/drafts/draftees/index.svelte';

  interface Props {
    draftId: bigint;
    studentCount: number;
  }

  const { draftId, studentCount }: Props = $props();
</script>

<div class="space-y-4">
  <div class="prose dark:prose-invert">
    <p>
      <strong>{studentCount}</strong> students registered for this draft before registration closed.
    </p>
  </div>
  <div class="flex items-center justify-center">
    <Draftees
      {draftId}
      queryKey="final-registered-students"
      customTextOnEmpty="No students have registered."
    >
      {#snippet trigger()}
        <Button variant="outline" class="border-primary text-primary"
          >See Registered Students</Button
        >
      {/snippet}
    </Draftees>
  </div>
</div>
