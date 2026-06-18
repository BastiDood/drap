<script lang="ts">
  import { format } from 'date-fns';

  import DesignatedLab from '$lib/users/designated-lab.svelte';
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type { DraftAssignmentRecord } from '$lib/features/drafts/types';

  interface Props {
    regularDrafted: DraftAssignmentRecord[];
    interventionDrafted: DraftAssignmentRecord[];
    lotteryDrafted: DraftAssignmentRecord[];
  }

  const { regularDrafted, interventionDrafted, lotteryDrafted }: Props = $props();
</script>

<div class="flex flex-col gap-8">
  <div id="section-regular-drafted" class="grid gap-4">
    <h3 class="text-2xl font-bold">Regular Drafted ({regularDrafted.length})</h3>
    <ul class="space-y-2">
      {#each regularDrafted as { id, email, givenName, familyName, avatarUrl, studentNumber, labId, round } (id)}
        <li>
          <UserlistItem
            {email}
            {givenName}
            {familyName}
            {studentNumber}
            avatar={{ variant: 'profile', url: avatarUrl, alt: `${givenName} ${familyName}` }}
            class="bg-transparent p-0"
          >
            {#snippet badges()}
              <DesignatedLab {labId} />
              <Badge
                variant="outline"
                class="h-fit border-secondary bg-secondary/10 px-2 py-1 text-xs"
              >
                Round {round}
              </Badge>
            {/snippet}
          </UserlistItem>
        </li>
      {:else}
        <li>
          <p class="text-sm text-muted-foreground">No regular-round assignments recorded.</p>
        </li>
      {/each}
    </ul>
  </div>

  <div id="section-intervention-drafted" class="grid gap-4">
    <h3 class="text-2xl font-bold">Intervention Drafted ({interventionDrafted.length})</h3>
    <ul class="space-y-2">
      {#each interventionDrafted as { id, email, givenName, familyName, avatarUrl, studentNumber, labId, assignedAt } (id)}
        <li>
          <UserlistItem
            {email}
            {givenName}
            {familyName}
            {studentNumber}
            avatar={{ variant: 'profile', url: avatarUrl, alt: `${givenName} ${familyName}` }}
            class="bg-transparent p-0"
          >
            {#snippet badges()}
              <DesignatedLab {labId} />
              <Badge
                variant="outline"
                class="h-fit border-secondary bg-secondary/10 px-2 py-1 text-xs"
              >
                {#if assignedAt === null}
                  <span id="intervention-date-{id}">Unknown Date</span>
                {:else}
                  <time id="intervention-date-{id}" datetime={assignedAt.toISOString()}>
                    {format(assignedAt, 'PPP p')}
                  </time>
                {/if}
              </Badge>
            {/snippet}
          </UserlistItem>
        </li>
      {:else}
        <li>
          <p class="text-sm text-muted-foreground">No intervention assignments were made.</p>
        </li>
      {/each}
    </ul>
  </div>
  <div id="section-lottery-drafted" class="grid gap-4">
    <h3 class="text-2xl font-bold">Lottery Drafted ({lotteryDrafted.length})</h3>
    <ul class="space-y-2">
      {#each lotteryDrafted as { id, email, givenName, familyName, avatarUrl, studentNumber, labId } (id)}
        <li>
          <UserlistItem
            {email}
            {givenName}
            {familyName}
            {studentNumber}
            avatar={{ variant: 'profile', url: avatarUrl, alt: `${givenName} ${familyName}` }}
            class="bg-transparent p-0"
          >
            {#snippet badges()}
              <DesignatedLab {labId} />
            {/snippet}
          </UserlistItem>
        </li>
      {:else}
        <li>
          <p class="text-sm text-muted-foreground">No lottery assignments were recorded.</p>
        </li>
      {/each}
    </ul>
  </div>
</div>
