<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';

  import * as Alert from '$lib/components/ui/alert';
  import type {
    DraftFinalizedBreakdown,
    DraftRegistrationAllowlistEntry,
    Student,
  } from '$lib/features/drafts/types';

  import QuotaSnapshotForm from '$lib/features/drafts/timeline/quota-snapshot-form.svelte';

  import AllowlistForm from './allowlist-form.svelte';
  import StartForm from './start-form.svelte';
  import StudentList from './student-list.svelte';

  interface Props {
    draftId: bigint;
    students: Student[];
    snapshots: DraftFinalizedBreakdown['snapshots'];
    allowlist: DraftRegistrationAllowlistEntry[];
  }

  const { draftId, students, snapshots, allowlist }: Props = $props();
</script>

<div class="space-y-4">
  {#if students.length > 0}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
      <div class="space-y-4">
        <section class="prose dark:prose-invert">
          <h3>Registered Students</h3>
          <p>
            Registration has closed. There are currently <strong>{students.length}</strong> students who
            registered for this draft.
          </p>
          <p>
            Use the allowlist below to grant additional students access to submit their rankings
            before starting the draft.
          </p>
        </section>
        <QuotaSnapshotForm {draftId} mode="initial" {snapshots} />
        <StartForm {draftId} />
      </div>
      <StudentList {students} />
    </div>
  {:else}
    <Alert.Root variant="info">
      <LockIcon />
      <Alert.Description>
        Registration has closed. No students registered for this draft.
      </Alert.Description>
    </Alert.Root>
  {/if}

  <hr class="border-border" />

  <AllowlistForm {draftId} {allowlist} />
</div>
