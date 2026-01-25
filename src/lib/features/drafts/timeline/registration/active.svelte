<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert';

  import type { Student } from '$lib/features/drafts/types';

  import StartForm from './start-form.svelte';
  import StudentList from './student-list.svelte';

  interface Props {
    draftId: bigint;
    students: Student[];
  }

  const { draftId, students }: Props = $props();
</script>

<div class="space-y-4">
  {#if students.length > 0}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
      <div class="space-y-4">
        <section class="prose dark:prose-invert">
          <h3>Registered Students</h3>
          <p>
            There are currently <strong>{students.length}</strong> students who have registered for
            this draft. Press the <strong>"Start Draft"</strong> button to close registration and start
            the draft automation.
          </p>
          <p>
            Lab heads will be notified when the first round begins. The draft proceeds to the next
            round when all lab heads have submitted their preferences. This process repeats until
            the configured maximum number of rounds has elapsed, after which the draft pauses until
            an administrator <em>manually</em> proceeds with the lottery stage.
          </p>
        </section>
        <StartForm {draftId} />
      </div>
      <StudentList {students} />
    </div>
  {:else}
    <Alert.Root variant="warning">
      <TriangleAlertIcon />
      <Alert.Description>
        No students have registered for this draft yet. The draft cannot proceed until at least one
        student participates.
      </Alert.Description>
    </Alert.Root>
  {/if}
</div>
