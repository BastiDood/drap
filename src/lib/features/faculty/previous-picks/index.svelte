<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import DraftAvatar from '$lib/components/draft-avatar.svelte';
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
  <Card.Content>
    <Tabs.Root value={latestRound}>
      <Tabs.List>
        {#each Object.keys(researchersByRound)
          .map(Number)
          .toSorted((a, b) => a - b) as round (round)}
          <Tabs.Trigger value={round.toString()}>Round {round}</Tabs.Trigger>
        {/each}
      </Tabs.List>
      {#each Object.entries(researchersByRound) as [round, students = []] (round)}
        <Tabs.Content value={round}>
          <ul class="space-y-1">
            {#each students as { email, givenName, familyName, avatarObjectKey, studentNumber } (email)}
              <li>
                <a
                  href="mailto:{email}"
                  class="flex items-center gap-3 rounded-md bg-muted p-2 transition-colors duration-150 hover:bg-muted/80"
                >
                  {#if avatarObjectKey === null}
                    <DraftAvatar class="size-10" />
                  {:else}
                    <DraftAvatar
                      avatar={{
                        objectKey: avatarObjectKey,
                        alt: `${givenName} ${familyName}`,
                      }}
                      class="size-10"
                    />
                  {/if}
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
