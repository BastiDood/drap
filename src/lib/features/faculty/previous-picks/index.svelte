<script lang="ts">
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';

  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import Empty from '$lib/components/empty.svelte';
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import type { schema } from '$lib/server/database/drizzle';

  interface Researcher extends Pick<
    schema.User,
    'email' | 'givenName' | 'familyName' | 'studentNumber'
  > {
    avatarObjectKey: schema.StudentRank['avatarObjectKey'];
    round: number;
  }

  interface Props {
    researchers: Researcher[];
  }

  const { researchers }: Props = $props();

  const researchersByRound = $derived(Object.groupBy(researchers, r => r.round));
  const latestRound = $derived(Math.max(...Object.keys(researchersByRound).map(Number)).toString());
</script>

<Card.Root id="previous-picks" variant="soft">
  <Card.Header>
    <Card.Title>Previous Picks</Card.Title>
  </Card.Header>
  <Card.Content class="flex min-h-0 grow flex-col">
    {#if researchers.length === 0}
      <Empty media={{ icon: ClipboardListIcon, size: 'sm' }}>
        {#snippet title()}No Picks Yet{/snippet}
        {#snippet description()}Students you select will appear here after each round.{/snippet}
      </Empty>
    {:else}
      {@const sortedRounds = Object.keys(researchersByRound)
        .map(Number)
        .sort((a, b) => a - b)}
      <Tabs.Root value={latestRound}>
        <Tabs.List>
          {#each sortedRounds as round (round)}
            <Tabs.Trigger value={round.toString()}>Round {round}</Tabs.Trigger>
          {/each}
        </Tabs.List>
        {#each Object.entries(researchersByRound) as [round, students = []] (round)}
          <Tabs.Content value={round}>
            <ul class="space-y-1">
              {#each students as { email, givenName, familyName, avatarObjectKey, studentNumber } (email)}
                <li>
                  <UserlistItem
                    {email}
                    {givenName}
                    {familyName}
                    {studentNumber}
                    avatar={{
                      variant: 'draft',
                      objectKey: avatarObjectKey,
                      alt: `${givenName} ${familyName}`,
                    }}
                    class="bg-muted transition-colors duration-150 hover:bg-muted/80"
                  />
                </li>
              {/each}
            </ul>
          </Tabs.Content>
        {/each}
      </Tabs.Root>
    {/if}
  </Card.Content>
</Card.Root>
