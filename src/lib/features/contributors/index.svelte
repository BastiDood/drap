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
      roles: { '2024': 'Lead Engineer', '2025': 'Lead Engineer', '2026': 'Project Head' },
      github: 'BastiDood',
      website: 'https://bastidood.dev/',
    },
    {
      name: 'Jelly Raborar',
      avatar: 'https://avatars.githubusercontent.com/u/98273014',
      roles: { '2024': 'Designer', '2025': 'Designer', '2026': 'Design Team: Head' },
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
      name: 'Eriene Galinato',
      avatar: 'https://avatars.githubusercontent.com/u/99855294',
      roles: { '2026': 'App Team: Head' },
      github: 'galierie',
    },
    {
      name: 'Harry Quijano',
      avatar: 'https://avatars.githubusercontent.com/u/87745547',
      roles: { '2026': 'Infrastructure Team: Head' },
      github: 'Harry2166',
    },
    {
      name: 'Michael Real',
      avatar: 'https://avatars.githubusercontent.com/u/60802461',
      roles: { '2026': 'Infrastructure Team: Engineer' },
      github: 'mcjefdreal',
    },
    {
      name: 'Ysaac Villamil',
      avatar: 'https://avatars.githubusercontent.com/u/115415483',
      roles: { '2026': 'App Team: Engineer' },
      github: 'LigsQt',
    },
    {
      name: 'Ehren Castillo',
      avatar: 'https://avatars.githubusercontent.com/u/59799738',
      roles: { '2025': 'Engineer', '2026': 'App Team: Engineer' },
      github: 'ehrelevant',
      website: 'https://www.ehrencastillo.tech/',
    },
    {
      name: 'Marcus Pascual',
      avatar: 'https://avatars.githubusercontent.com/u/149664258',
      roles: { '2026': 'Design Team: Engineer' },
      github: 'syncopascual',
    },
    {
      name: 'Ervin Mercado',
      avatar: 'https://avatars.githubusercontent.com/u/173535366',
      roles: { '2026': 'App Team: Engineer' },
      github: 'ervnmrcdo',
    },
    {
      name: 'Benj Lazaro',
      avatar: 'https://avatars.githubusercontent.com/u/159742520',
      roles: { '2026': 'Design Team: Engineer' },
      github: 'Enoux',
    },
    {
      name: 'Jan Albert Quidet',
      avatar: 'https://avatars.githubusercontent.com/u/55362458',
      roles: { '2026': 'App Team: Engineer' },
      github: 'jdquidet',
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
