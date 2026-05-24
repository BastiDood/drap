<script lang="ts">
  import { format } from 'date-fns';

  import DesignatedLab from '$lib/users/designated-lab.svelte';
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
    <div class="space-y-2">
      {#each regularDrafted as { id, email, givenName, familyName, studentNumber, labId, round } (id)}
        <div class="flex items-center justify-between space-y-1">
          <div class="flex flex-col">
            <span>{familyName.toUpperCase()}, {givenName}</span>
            {#if studentNumber === null}
              <span class="text-sm text-muted-foreground">{email}</span>
            {:else}
              <span class="text-sm text-muted-foreground">{studentNumber} | {email}</span>
            {/if}
          </div>
          <div class="flex items-center justify-end gap-1">
            <DesignatedLab {labId} />
            <Badge
              variant="outline"
              class="h-fit border-secondary bg-secondary/10 px-2 py-1 text-xs"
            >
              Round {round}
            </Badge>
          </div>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No regular-round assignments recorded.</p>
      {/each}
    </div>
  </div>

  <div id="section-intervention-drafted" class="grid gap-4">
    <h3 class="text-2xl font-bold">Intervention Drafted ({interventionDrafted.length})</h3>
    <div class="space-y-2">
      {#each interventionDrafted as { id, email, givenName, familyName, studentNumber, labId, assignedAt } (id)}
        <div class="flex items-center justify-between space-y-1">
          <div class="flex flex-col">
            <span>{familyName.toUpperCase()}, {givenName}</span>
            {#if studentNumber === null}
              <span class="text-sm text-muted-foreground">{email}</span>
            {:else}
              <span class="text-sm text-muted-foreground">{studentNumber} | {email}</span>
            {/if}
          </div>
          <div class="flex items-center justify-end gap-1">
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
          </div>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No intervention assignments were made.</p>
      {/each}
    </div>
  </div>
  <div id="section-lottery-drafted" class="grid gap-4">
    <h3 class="text-2xl font-bold">Lottery Drafted ({lotteryDrafted.length})</h3>
    <div class="space-y-2">
      {#each lotteryDrafted as { id, email, givenName, familyName, studentNumber, labId } (id)}
        <div class="flex items-center justify-between space-y-1">
          <div class="flex flex-col">
            <span>{familyName.toUpperCase()}, {givenName}</span>
            {#if studentNumber === null}
              <span class="text-sm text-muted-foreground">{email}</span>
            {:else}
              <span class="text-sm text-muted-foreground">{studentNumber} | {email}</span>
            {/if}
          </div>
          <DesignatedLab {labId} />
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No lottery assignments were recorded.</p>
      {/each}
    </div>
  </div>
</div>
