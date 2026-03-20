<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';

  import * as Alert from '$lib/components/ui/alert';
  import QuotaSnapshotForm from '$lib/features/drafts/timeline/quota-snapshot-form.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';
  import type { DraftFinalizedBreakdown } from '$lib/features/drafts/types';

  import StartForm from './start-form.svelte';
  import { AllowlistDialog } from './allowlist';

  interface Props {
    draftId: string;
    studentCount: number;
    allowlistCount: number;
    snapshots: DraftFinalizedBreakdown['snapshots'];
  }

  const { draftId, studentCount, allowlistCount, snapshots }: Props = $props();

  let allowlistCountOverride = $state<number | null>(null);
  const currentAllowlistCount = $derived(allowlistCountOverride ?? allowlistCount);

  function handleCountChange(count: number) {
    allowlistCountOverride = count;
  }
</script>

<div class="space-y-4">
  {#if studentCount > 0}
    <div class="space-y-4">
      <section class="prose dark:prose-invert">
        <h3>Registered Students</h3>
        <p>
          Registration has closed. There are currently <strong>{studentCount}</strong> students who registered
          for this draft.
        </p>
        <p>
          Use the allowlist to grant additional students access to submit their rankings before
          starting the draft.
        </p>
      </section>
      <QuotaSnapshotForm {draftId} mode="initial" {snapshots} />
      <div class="flex items-center justify-center">
        <RegisteredDraftees {draftId} variant="primary">
          No students have registered for this draft.
        </RegisteredDraftees>
      </div>
      <StartForm {draftId} />
    </div>
  {:else}
    <Alert.Root variant="info">
      <LockIcon />
      <Alert.Description>
        Registration has closed. No students registered for this draft.
      </Alert.Description>
    </Alert.Root>
  {/if}

  <AllowlistDialog
    {draftId}
    allowlistCount={currentAllowlistCount}
    onCountChange={handleCountChange}
  />
</div>
