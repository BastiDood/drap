<script lang="ts">
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';

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
    <RegisteredDraftees {draftId} variant="primary">No students have registered.</RegisteredDraftees
    >
  </div>
</div>
