<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import LockIcon from '@lucide/svelte/icons/lock';

  import * as Alert from '$lib/components/ui/alert';
  import * as Popover from '$lib/components/ui/popover';
  import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  import { AllowlistDialog } from './allowlist';

  interface Props {
    draftId: string;
    studentCount: number;
    allowlistCount: number;
    snapshots: DraftLabQuotaSnapshot[];
  }

  const { draftId, studentCount, allowlistCount, snapshots }: Props = $props();
</script>

<div class="space-y-4">
  {#if studentCount > 0}
    <div class="space-y-4">
      <section class="prose dark:prose-invert">
        <h3 class="flex items-center gap-1.5">
          Registered Students
          <Popover.Root>
            <Popover.Trigger class="leading-none transition hover:opacity-80">
              <CircleHelpIcon class="size-3.5 text-muted-foreground" />
            </Popover.Trigger>
            <Popover.Content class="max-w-sm space-y-2 text-sm font-normal">
              <p>
                Registration has closed. There are currently <strong>{studentCount}</strong> students
                who registered for this draft.
              </p>
              <p>
                Use the allowlist to grant additional students access to submit their rankings
                before starting the draft.
              </p>
            </Popover.Content>
          </Popover.Root>
        </h3>
        <p>
          Registration has closed. There are currently <strong>{studentCount}</strong> students who registered
          for this draft.
        </p>
      </section>
      <QuotaCard {draftId} mode="initial" {snapshots} />
      <div class="flex items-center justify-center">
        <RegisteredDraftees {draftId} variant="primary">
          No students have registered for this draft.
        </RegisteredDraftees>
      </div>
    </div>
  {:else}
    <Alert.Root variant="info">
      <LockIcon />
      <Alert.Description>
        Registration has closed. No students registered for this draft.
      </Alert.Description>
    </Alert.Root>
  {/if}

  <AllowlistDialog {draftId} {allowlistCount} />
</div>
