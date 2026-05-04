<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import UserRoundPlusIcon from '@lucide/svelte/icons/user-round-plus';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Alert from '$lib/components/ui/alert';
  import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';
  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  import { AllowlistSheet } from './allowlist';

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
      <div class="grid w-fit grid-cols-1 gap-2 sm:grid-cols-[repeat(2,minmax(10rem,14rem))]">
        <StatCard icon={UsersIcon}>
          {#snippet title()}Registered Students{/snippet}
          {#snippet body()}
            <p id="stat-registered-students" class="text-2xl font-bold tabular-nums">
              {studentCount}
            </p>
          {/snippet}
          {#snippet subtitle()}Registration Closed{/snippet}
        </StatCard>
        <StatCard icon={UserRoundPlusIcon}>
          {#snippet title()}Allowlisted Students{/snippet}
          {#snippet body()}
            <p id="stat-allowlisted-students" class="text-2xl font-bold tabular-nums">
              {allowlistCount}
            </p>
          {/snippet}
          {#snippet subtitle()}Late Registration Access{/snippet}
        </StatCard>
      </div>
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
  <AllowlistSheet {draftId} {allowlistCount} />
</div>
