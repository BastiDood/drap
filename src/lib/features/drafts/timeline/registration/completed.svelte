<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import type { Student } from '$lib/features/drafts/types';

  import Draftees from '../../draftees/index.svelte';

  interface Props {
    draftId: bigint;
    students: Student[];
  }

  const { draftId, students }: Props = $props();
</script>

<div class="space-y-4">
  <div class="prose dark:prose-invert">
    <p>
      <strong>{students.length}</strong> students registered for this draft before registration closed.
    </p>
  </div>
  <div class="flex items-center justify-center">
    <Draftees {draftId} queryKey="final-registered-students" customTextOnEmpty="No students have registered.">
      {#snippet trigger()}
        <Button variant="outline" class="border-primary text-primary">See Registered Students</Button>
      {/snippet}
    </Draftees>
  </div>
</div>
