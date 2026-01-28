<script lang="ts">
  import Callout from '$lib/components/callout.svelte';
  import SubmissionSummary from '$lib/features/student/submission-summary.svelte';
  import type { schema } from '$lib/server/database';

  export interface Lab extends Pick<schema.Lab, 'name'> {
    remark: string;
  }

  interface Props {
    submission: {
      createdAt: Date;
      labs: Lab[];
    };
  }

  const { submission }: Props = $props();
</script>

<div class="space-y-6">
  <Callout variant="success" title="Registration Complete">
    Your lab preferences have been submitted. The draft will begin soon. You will be notified when
    results are available.
  </Callout>
  <SubmissionSummary {submission} />
</div>
