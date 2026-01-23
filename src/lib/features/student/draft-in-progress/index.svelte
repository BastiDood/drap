<script lang="ts">
  import SubmissionSummary, {
    type Submission,
  } from '$lib/features/student/submission-summary.svelte';

  import DraftProgressBar, { type Draft } from './draft-progress.svelte';

  interface Props {
    draft: Draft;
    submission: Submission;
  }

  const { draft, submission }: Props = $props();
</script>

<div class="space-y-6">
  <DraftProgressBar {draft} />
  <SubmissionSummary {submission} />
</div>
