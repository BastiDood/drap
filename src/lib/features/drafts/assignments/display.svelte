<script lang="ts">
  import { format } from 'date-fns';

  import * as Accordion from '$lib/components/ui/accordion';
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type { DraftAssignmentRecord } from '$lib/features/drafts/types';

  interface Props {
    regularDrafted: DraftAssignmentRecord[];
    interventionDrafted: DraftAssignmentRecord[];
    lotteryDrafted: DraftAssignmentRecord[];
  }

  const { regularDrafted, interventionDrafted, lotteryDrafted }: Props = $props();

  const regularDraftGroups = $derived.by(() => {
    return Object.entries(Object.groupBy(regularDrafted, ({ round }) => round?.toString() ?? ''))
      .filter(([round]) => round.length > 0)
      .map(([round, assignments = []]) => ({
        round: Number(round),
        assignments,
      }))
      .sort((a, b) => a.round - b.round);
  });
</script>

<Accordion.Root
  type="multiple"
  value={['regular-drafted', 'intervention-drafted', 'lottery-drafted']}
  class="space-y-2"
>
  <Accordion.Item id="section-regular-drafted" value="regular-drafted">
    <Accordion.Trigger class="py-3" level={3}>
      <span class="flex items-center gap-2">
        <span class="text-xl font-bold">Regular Drafted</span>
        <Badge variant="secondary" class="tabular-nums">{regularDrafted.length}</Badge>
      </span>
    </Accordion.Trigger>
    <Accordion.Content>
      {#if regularDraftGroups.length === 0}
        <p class="text-sm text-muted-foreground">No regular-round assignments recorded.</p>
      {:else}
        <div class="space-y-5">
          {#each regularDraftGroups as { round, assignments } (round)}
            <section class="space-y-2">
              <h4 class="text-sm font-semibold text-muted-foreground">Round {round}</h4>
              <ul class="space-y-2">
                {#each assignments as { id, email, givenName, familyName, avatarUrl, studentNumber, labId } (id)}
                  <li
                    class="grid items-center gap-3 rounded-lg bg-card p-2 @container sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <UserlistItem
                      {email}
                      {givenName}
                      {familyName}
                      {studentNumber}
                      avatar={{
                        variant: 'profile',
                        url: avatarUrl,
                        alt: `${givenName} ${familyName}`,
                      }}
                      class="bg-transparent p-0"
                    />
                    <div class="justify-self-end">
                      <Badge
                        variant="outline"
                        class="h-fit border-secondary bg-secondary/10 px-2 py-1 text-xs uppercase"
                        >{labId}</Badge
                      >
                    </div>
                  </li>
                {/each}
              </ul>
            </section>
          {/each}
        </div>
      {/if}
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item id="section-intervention-drafted" value="intervention-drafted">
    <Accordion.Trigger class="py-3" level={3}>
      <span class="flex items-center gap-2">
        <span class="text-xl font-bold">Intervention Drafted</span>
        <Badge variant="secondary" class="tabular-nums">{interventionDrafted.length}</Badge>
      </span>
    </Accordion.Trigger>
    <Accordion.Content>
      <ul class="space-y-2">
        {#each interventionDrafted as { id, email, givenName, familyName, avatarUrl, studentNumber, labId, assignedAt } (id)}
          <li
            class="grid items-center gap-3 rounded-lg bg-card p-2 @container sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <UserlistItem
              {email}
              {givenName}
              {familyName}
              {studentNumber}
              avatar={{ variant: 'profile', url: avatarUrl, alt: `${givenName} ${familyName}` }}
              class="bg-transparent p-0"
            />
            <div class="flex flex-col items-end gap-1 justify-self-end text-right text-sm">
              <Badge
                variant="outline"
                class="h-fit border-secondary bg-secondary/10 px-2 py-1 text-xs uppercase"
                >{labId}</Badge
              >
              {#if assignedAt === null}
                <span id="intervention-date-{id}" class="text-xs text-muted-foreground/90"
                  >Unknown Date</span
                >
              {:else}
                <time
                  id="intervention-date-{id}"
                  datetime={assignedAt.toISOString()}
                  class="text-xs"
                >
                  {format(assignedAt, 'PPP p')}
                </time>
              {/if}
            </div>
          </li>
        {:else}
          <li>
            <p class="text-sm text-muted-foreground">No intervention assignments were made.</p>
          </li>
        {/each}
      </ul>
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item id="section-lottery-drafted" value="lottery-drafted">
    <Accordion.Trigger class="py-3" level={3}>
      <span class="flex items-center gap-2">
        <span class="text-xl font-bold">Lottery Drafted</span>
        <Badge variant="secondary" class="tabular-nums">{lotteryDrafted.length}</Badge>
      </span>
    </Accordion.Trigger>
    <Accordion.Content>
      <ul class="space-y-2">
        {#each lotteryDrafted as { id, email, givenName, familyName, avatarUrl, studentNumber, labId } (id)}
          <li
            class="grid items-center gap-3 rounded-lg bg-card p-2 @container sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <UserlistItem
              {email}
              {givenName}
              {familyName}
              {studentNumber}
              avatar={{ variant: 'profile', url: avatarUrl, alt: `${givenName} ${familyName}` }}
              class="bg-transparent p-0"
            />
            <div class="justify-self-end">
              <Badge
                variant="outline"
                class="h-fit border-secondary bg-secondary/10 px-2 py-1 text-xs uppercase"
                >{labId}</Badge
              >
            </div>
          </li>
        {:else}
          <li>
            <p class="text-sm text-muted-foreground">No lottery assignments were recorded.</p>
          </li>
        {/each}
      </ul>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
