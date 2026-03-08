<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import type { schema } from '$lib/server/database/drizzle';

  interface Researcher extends Pick<
    schema.User,
    'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  > {
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
  <Card.Content>
    <Tabs.Root value={latestRound}>
      <Tabs.List>
        {#each Object.keys(researchersByRound)
          .map(Number)
          .toSorted((a, b) => a - b) as round (round)}
          <Tabs.Trigger value={String(round)}>Round {round}</Tabs.Trigger>
        {/each}
      </Tabs.List>
      {#each Object.entries(researchersByRound) as [round, students = []] (round)}
        <Tabs.Content value={round}>
          <ul class="space-y-1">
            {#each students as { email, givenName, familyName, avatarUrl, studentNumber } (email)}
              <li>
                <a
                  href="mailto:{email}"
                  class="bg-muted hover:bg-muted/80 flex items-center gap-3 rounded-md p-2 transition-colors duration-150"
                >
                  <Avatar.Root class="size-10">
                    <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
                    <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
                  </Avatar.Root>
                  <div class="flex grow flex-col">
                    <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
                    {#if studentNumber !== null}
                      <span class="text-sm opacity-50">{studentNumber}</span>
                    {/if}
                    <span class="text-xs opacity-50">{email}</span>
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        </Tabs.Content>
      {/each}
    </Tabs.Root>
  </Card.Content>
</Card.Root>
