<script lang="ts">
  import * as Tabs from '$lib/components/ui/tabs';

  import ContributorCard, { type Props as ContributorCardProps } from './card.svelte';

  const CONTRIBUTOR_YEARS = ['2024', '2025', '2026'] as const;
  type ContributorYear = (typeof CONTRIBUTOR_YEARS)[number];

  interface Contributor extends Omit<ContributorCardProps, 'role'> {
    roles: Partial<Record<ContributorYear, string>>;
  }

  const CONTRIBUTORS: Contributor[] = [
    {
      name: 'Basti Ortiz',
      avatar: 'https://avatars.githubusercontent.com/u/39114273',
      roles: { '2024': 'Lead Engineer', '2025': 'Lead Engineer', '2026': 'Lead Engineer' },
      github: 'BastiDood',
      website: 'https://bastidood.dev/',
    },
    {
      name: 'Jelly Raborar',
      avatar: 'https://avatars.githubusercontent.com/u/98273014',
      roles: { '2024': 'Designer', '2025': 'Designer', '2026': 'Designer' },
      github: 'Anjellyrika',
    },
    {
      name: 'Victor Reyes',
      avatar: 'https://avatars.githubusercontent.com/u/95967340',
      roles: { '2024': 'Engineer', '2025': 'Lead Engineer' },
      github: 'VeeIsForVictor',
      website: 'https://veeisforvictor.github.io/My-Portfolio/',
    },
    {
      name: 'Ehren Castillo',
      avatar: 'https://avatars.githubusercontent.com/u/59799738',
      roles: { '2025': 'Engineer', '2026': 'Engineer' },
      github: 'ehrelevant',
      website: 'https://www.ehrencastillo.tech/',
    },
  ];

  function getContributorsByYear(year: ContributorYear) {
    return CONTRIBUTORS.reduce<ContributorCardProps[]>(
      (acc, { name, roles, avatar, website, github }) => {
        const role = roles[year];
        if (typeof role !== 'undefined') acc.push({ name, role, avatar, website, github });
        return acc;
      },
      [],
    );
  }
</script>

<Tabs.Root value="all" class="mt-6">
  <Tabs.List class="w-full">
    <Tabs.Trigger value="all">All</Tabs.Trigger>
    {#each CONTRIBUTOR_YEARS as year (year)}
      <Tabs.Trigger value={year}>{year}</Tabs.Trigger>
    {/each}
  </Tabs.List>
  <Tabs.Content value="all">
    <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
      {#each CONTRIBUTORS as { name, avatar, website, github } (name)}
        <ContributorCard {name} {avatar} {website} {github} />
      {/each}
    </div>
  </Tabs.Content>
  {#each CONTRIBUTOR_YEARS as year (year)}
    {@const contributors = getContributorsByYear(year)}
    <Tabs.Content value={year}>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        {#each contributors as { name, role, avatar, website, github } (name)}
          <ContributorCard {name} {role} {avatar} {website} {github} />
        {/each}
      </div>
    </Tabs.Content>
  {/each}
</Tabs.Root>
