<script lang="ts" module>
  export interface Props {
    draftId: string;
    allowlistCount: number;
  }
</script>

<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';

  import AllowlistContent from './content.svelte';

  const { draftId, allowlistCount }: Props = $props();

  let open = $state(false);

  function getAllowlistSummary(count: number) {
    if (count === 0) return 'No students are currently on the allowlist.';
    if (count === 1) return '1 student is currently on the allowlist.';
    return `${count} students are currently on the allowlist.`;
  }
</script>

<Dialog.Root bind:open>
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
      <Dialog.Trigger>
        {#snippet child({ props })}
          <Button variant="outline" class="border-accent text-accent" {...props}>
            Manage Allowlist
          </Button>
        {/snippet}
      </Dialog.Trigger>
    </div>
  </div>

  <Dialog.Content class="sm:max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>Draft Registration Allowlist</Dialog.Title>
      <Dialog.Description>
        Allow specific students to submit rankings after the registration deadline has passed.
      </Dialog.Description>
    </Dialog.Header>
    {#if open}
      <AllowlistContent {draftId} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
