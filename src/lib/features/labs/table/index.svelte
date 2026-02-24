<script lang="ts" module>
  import type { ActiveLab, ArchivedLab, Lab } from '$lib/features/labs/types';

  export interface Props {
    labs: Lab[];
  }
</script>

<script lang="ts">
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';

  import * as Tabs from '$lib/components/ui/tabs';
  import CreateLabDialog from '$lib/features/labs/create/dialog.svelte';
  import { Badge } from '$lib/components/ui/badge';

  import ActiveTable from './active/index.svelte';
  import ArchivedTable from './archived/index.svelte';

  type TabType = 'active' | 'archived';

  const { labs }: Props = $props();

  let tab: TabType = $state('active');

  const { activeLabs, archivedLabs } = $derived.by(() => {
    const { active = [], archived = [] } = Object.groupBy(labs, ({ deletedAt }) =>
      deletedAt === null ? 'active' : 'archived',
    );

    const activeLabs = active.map(({ id, name }): ActiveLab => ({ id, name }));
    const archivedLabs = archived.reduce((labs, lab): ArchivedLab[] => {
      if (lab.deletedAt !== null)
        labs.push({ id: lab.id, name: lab.name, deletedAt: lab.deletedAt });
      return labs;
    }, []);

    return { activeLabs, archivedLabs };
  });
</script>

<Tabs.Root
  value={tab}
  onValueChange={value => {
    if (value === 'active' || value === 'archived') tab = value;
  }}
>
  <div class="flex items-center justify-between">
    <Tabs.List>
      <Tabs.Trigger value="active">
        <FlaskConicalIcon class="size-4" />
        <span>Active Labs</span>
        <Badge variant="secondary" class="ml-1">{activeLabs.length}</Badge>
      </Tabs.Trigger>
      <Tabs.Trigger value="archived">
        <ArchiveIcon class="size-4" />
        <span>Archived Labs</span>
        <Badge variant="secondary" class="ml-1">{archivedLabs.length}</Badge>
      </Tabs.Trigger>
    </Tabs.List>
    <CreateLabDialog />
  </div>
  <Tabs.Content value="active">
    <ActiveTable labs={activeLabs} />
  </Tabs.Content>
  <Tabs.Content value="archived">
    <ArchivedTable labs={archivedLabs} />
  </Tabs.Content>
</Tabs.Root>
