<script lang="ts">
  import Draftees from '$lib/features/drafts/draftees/index.svelte';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    draftId: string;
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
    <Draftees {draftId} customTextOnEmpty="No students have registered.">
      {#snippet trigger(props)}
        <Button variant="outline" class="border-primary text-primary" {...props}
          >See Registered Students</Button
        >
      {/snippet}
    </Draftees>
  </div>
</div>
