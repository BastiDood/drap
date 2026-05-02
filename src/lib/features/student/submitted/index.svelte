<script lang="ts">
  import * as Alert from '$lib/components/ui/alert';
  import DraftAvatar from '$lib/components/draft-avatar.svelte';
  import SubmissionSummary from '$lib/features/student/submission-summary.svelte';
  import type { schema } from '$lib/server/database/drizzle';

  export interface Lab extends Pick<schema.Lab, 'name'> {
    remark: string;
  }

  interface Props {
    submission: {
      createdAt: Date;
      avatarObjectKey: string | null;
      labs: Lab[];
    };
  }

  const { submission }: Props = $props();
</script>

<div class="space-y-6">
  <Alert.Root variant="success" class="grid-cols-[auto_1fr] gap-x-4">
    {#if submission.avatarObjectKey === null}
      <DraftAvatar class="row-span-2 size-12" />
    {:else}
      <DraftAvatar
        avatar={{
          objectKey: submission.avatarObjectKey,
          alt: 'Your submitted photo',
        }}
        class="row-span-2 size-12"
      />
    {/if}
    <Alert.Title class="font-semibold">Registration Complete</Alert.Title>
    <Alert.Description>
      {#if submission.avatarObjectKey === null}
        Your lab preferences have been submitted. You chose not to share a photo; faculty will see
        only your name and student number.
      {:else}
        Your lab preferences have been submitted. Faculty will see this photo during review.
      {/if}
    </Alert.Description>
  </Alert.Root>
  <SubmissionSummary {submission} />
</div>
