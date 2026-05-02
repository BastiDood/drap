<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Faculty from '$lib/users/faculty.svelte';
  import { DraftAdminCard } from '$lib/features/users';

  import InviteSheet from './invite-sheet.svelte';

  const { data } = $props();
  const { labs, faculty, candidateSenders, selfUserId } = $derived(data);

  const { registeredAdmins = [], registeredHeads = [] } = $derived(
    Object.groupBy(faculty, ({ labName }) => {
      return labName === null ? 'registeredAdmins' : 'registeredHeads';
    }),
  );
</script>

<h2 class="mb-6 scroll-m-20 text-3xl font-semibold tracking-tight">Users</h2>
<div class="space-y-6">
  <Card.Root>
    <Card.Header
      class="flex flex-col items-start gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0"
    >
      <Card.Title class="text-2xl">Lab Heads</Card.Title>
      <InviteSheet {labs} />
    </Card.Header>
    <Card.Content>
      {#if registeredHeads.length === 0}
        <p class="text-sm text-muted-foreground">No registered users.</p>
      {:else}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {#each registeredHeads as { id, ...user } (id)}
            <Faculty {user} />
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
  <DraftAdminCard id="draft-admins" {selfUserId} {registeredAdmins} {candidateSenders}>
    <InviteSheet />
  </DraftAdminCard>
</div>
