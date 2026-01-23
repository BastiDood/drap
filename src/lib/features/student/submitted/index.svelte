<script lang="ts">
  import ClockIcon from '@lucide/svelte/icons/clock';

  import * as Alert from '$lib/components/ui/alert';
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
  <Alert.Root>
    <ClockIcon class="size-4" />
    <Alert.Title>Registration Complete</Alert.Title>
    <Alert.Description>
      Your lab preferences have been submitted. The draft will begin soon. You will be notified when
      results are available.
    </Alert.Description>
  </Alert.Root>
  <SubmissionSummary {submission} />
</div>
