<script lang="ts" module>
  export interface Props {
    draftId: string;
    allowlistCount: number;
  }
</script>

<script lang="ts">
  import UserRoundPlusIcon from '@lucide/svelte/icons/user-round-plus';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import AllowlistContent from './content.svelte';

  const { draftId, allowlistCount }: Props = $props();

  function getAllowlistSummary(count: number) {
    if (count === 0) return 'No students are currently on the allowlist.';
    if (count === 1) return '1 student is currently on the allowlist.';
    return `${count} students are currently on the allowlist.`;
  }
</script>

<Sheet.Root>
  <div class="rounded-lg border border-accent/30 bg-accent/5 p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <UsersIcon class="size-5 text-accent" />
          <h4 class="font-medium">Draft Registration Allowlist</h4>
        </div>
        <p class="text-sm text-muted-foreground">
          Grant late registration access without reopening registration for everyone.
        </p>
        <p class="text-sm text-muted-foreground">{getAllowlistSummary(allowlistCount)}</p>
      </div>
      <Sheet.Trigger>
        {#snippet child({ props })}
          <Button variant="outline" class="border-accent text-accent" {...props}>
            <UserRoundPlusIcon class="size-4" />
            <span>Manage Allowlist</span>
          </Button>
        {/snippet}
      </Sheet.Trigger>
    </div>
  </div>
  <Sheet.Content side="right" class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-md">
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Draft Registration Allowlist</Sheet.Title>
      <Sheet.Description>
        Allow specific students to submit rankings after the registration deadline has passed.
      </Sheet.Description>
    </Sheet.Header>
    <AllowlistContent {draftId} />
  </Sheet.Content>
</Sheet.Root>
