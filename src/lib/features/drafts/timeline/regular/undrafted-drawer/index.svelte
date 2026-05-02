<script lang="ts">
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';

  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';
  import type { Lab } from '$lib/features/drafts/types';

  import UndraftedDrawerLoader from './loader.svelte';

  interface Props {
    draftId: string;
    round: number;
    labs: Lab[];
  }

  const { draftId, round, labs }: Props = $props();
</script>

<Drawer.Root direction="bottom">
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" size="sm" {...props}>
        <GraduationCapIcon class="size-4" />
        <span>View Undrafted</span>
      </Button>
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content class="flex min-h-dvh flex-col gap-4 overflow-hidden p-4 md:min-h-[50vh]">
    <Drawer.Header class="shrink-0 p-0">
      <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <Drawer.Title>Undrafted Students</Drawer.Title>
          <Drawer.Description>
            Filter by lab to view who selected it this round or in upcoming rounds.
          </Drawer.Description>
        </div>
        <p class="text-sm text-muted-foreground">Current round: {round}</p>
      </div>
    </Drawer.Header>
    <div class="min-h-0 grow overflow-auto">
      <UndraftedDrawerLoader {draftId} {round} {labs} />
    </div>
  </Drawer.Content>
</Drawer.Root>
