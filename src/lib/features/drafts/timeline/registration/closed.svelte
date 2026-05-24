<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import UserRoundPlusIcon from '@lucide/svelte/icons/user-round-plus';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Alert from '$lib/components/ui/alert';
  import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';
  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import StatCardGroup from '$lib/features/drafts/timeline/stat-card-group.svelte';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  import { AllowlistSheet } from './allowlist-sheet';

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
    <StatCardGroup columns="two">
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
    </StatCardGroup>
  {:else}
    <Alert.Root variant="info">
      <LockIcon />
      <Alert.Description>
        Registration has closed. No students registered for this draft.
      </Alert.Description>
    </Alert.Root>
  {/if}
  <QuotaCard {draftId} mode="initial" {snapshots} />
  <AllowlistSheet {draftId} {allowlistCount} />
</div>
