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
      website: 'https://bastidood.dev/',
      email: 'ortiz@bastidood.dev',
      github: 'BastiDood',
      linkedin: 'basti-ortiz',
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
      linkedin: 'harry-quijano',
    },
    {
      name: 'Michael Real',
      avatar: 'https://avatars.githubusercontent.com/u/60802461',
      roles: { '2026': 'Infrastructure Team: Engineer' },
      github: 'mcjefdreal',
      linkedin: 'michael-jeffrey-real',
      website: 'https://mcjefd.dev/',
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
      website: 'https://www.ehrelevant.dev/',
      linkedin: 'ehren-castillo',
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
    return CONTRIBUTORS.reduce<ContributorCardProps[]>((acc, { roles, ...rest }) => {
      const role = roles[year];
      if (typeof role !== 'undefined') acc.push({ ...rest, role });
      return acc;
    }, []);
  }
</script>

<Tabs.Root value="all" class="@container">
  <Tabs.List class="w-full">
    <Tabs.Trigger value="all">All</Tabs.Trigger>
    {#each CONTRIBUTOR_YEARS as year (year)}
      <Tabs.Trigger value={year}>{year}</Tabs.Trigger>
    {/each}
  </Tabs.List>
  <Tabs.Content value="all">
    <div class="grid grid-cols-2 gap-2 @xl:grid-cols-4">
      {#each CONTRIBUTORS as contributor (contributor.name)}
        <ContributorCard {...contributor} />
      {/each}
    </div>
  </Tabs.Content>
  {#each CONTRIBUTOR_YEARS as year (year)}
    {@const contributors = getContributorsByYear(year)}
    <Tabs.Content value={year}>
      <div class="grid grid-cols-2 gap-2 @xl:grid-cols-4">
        {#each contributors as contributor (contributor.name)}
          <ContributorCard {...contributor} />
        {/each}
      </div>
    </Tabs.Content>
  {/each}
</Tabs.Root>
