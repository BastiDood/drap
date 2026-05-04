<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Alert from '$lib/components/ui/alert';
  import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';
  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  interface Props {
    draftId: string;
    studentCount: number;
    snapshots: DraftLabQuotaSnapshot[];
  }

  const { draftId, studentCount, snapshots }: Props = $props();
</script>

<div class="space-y-4">
  {#if studentCount > 0}
    <div class="space-y-4">
      <div class="grid w-fit grid-cols-1 gap-2 sm:grid-cols-[minmax(10rem,14rem)]">
        <StatCard icon={UsersIcon}>
          {#snippet title()}Registered Students{/snippet}
          {#snippet body()}
            <p id="stat-registered-students" class="text-2xl font-bold tabular-nums">
              {studentCount}
            </p>
          {/snippet}
          {#snippet subtitle()}Current Draft Participants{/snippet}
        </StatCard>
      </div>
      <QuotaCard {draftId} mode="initial" {snapshots} />
      <div class="flex items-center justify-center">
        <RegisteredDraftees {draftId} variant="accent">
          No students have registered yet.
        </RegisteredDraftees>
      </div>
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
