<script lang="ts">
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import PaperclipIcon from '@lucide/svelte/icons/paperclip';

  import * as Tabs from '$lib/components/ui/tabs';
  import Draftees from '$lib/features/drafts/draftees/index.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { FacultyChoiceRecord, Lab } from '$lib/features/drafts/types';

  import LabRoundSummary from './lab-round-summary.svelte';
  import SystemLogsTab from './system-logs-tab.svelte';

  type TabType = 'students' | 'labs' | 'logs';

  interface Props {
    draftId: string;
    round: number;
    labs: Lab[];
    records: FacultyChoiceRecord[];
  }

  const { draftId, round, labs, records }: Props = $props();

  let group: TabType = $state('students');
</script>

<Tabs.Root
  value={group}
  onValueChange={value => {
    if (value === 'students' || value === 'labs' || value === 'logs') group = value;
  }}
>
  <Tabs.List>
    <Tabs.Trigger value="students">
      <GraduationCapIcon class="size-5" />
      <span>Registered Students</span>
    </Tabs.Trigger>
    <Tabs.Trigger value="labs">
      <FlaskConicalIcon class="size-5" />
      <span>Laboratories</span>
    </Tabs.Trigger>
    <Tabs.Trigger value="logs">
      <PaperclipIcon class="size-5" />
      <span>System Logs</span>
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="students">
    <div class="flex items-center justify-around">
      <Draftees {draftId} mustShowDrafted={false} customTextOnEmpty="No available draftees.">
        {#snippet trigger(props)}
          <Button variant="outline" class="border-warning text-warning" {...props}
            >Pending Selection</Button
          >
        {/snippet}
      </Draftees>
      <Draftees {draftId} mustShowDrafted customTextOnEmpty="No drafted students yet.">
        {#snippet trigger(props)}
          <Button variant="outline" class="border-primary text-primary" {...props}
            >Already Drafted</Button
          >
        {/snippet}
      </Draftees>
    </div>
  </Tabs.Content>
  <Tabs.Content value="labs">
    {#each labs as lab (lab.id)}
      <LabRoundSummary {draftId} {round} {lab} />
    {/each}
  </Tabs.Content>
  <Tabs.Content value="logs">
    <SystemLogsTab {records} />
  </Tabs.Content>
</Tabs.Root>
