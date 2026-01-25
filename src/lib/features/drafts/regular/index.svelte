<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import PaperclipIcon from '@lucide/svelte/icons/paperclip';

  import * as Accordion from '$lib/components/ui/accordion';
  import * as Tabs from '$lib/components/ui/tabs';
  import Student from '$lib/users/student.svelte';

  import type {
    FacultyChoiceRecord,
    Lab,
    Student as StudentType,
  } from '$lib/features/drafts/types';

  import LabAccordionItem from './lab-accordion-item.svelte';
  import SystemLogsTab from './system-logs-tab.svelte';

  type TabType = 'students' | 'labs' | 'logs';

  interface Props {
    round: number;
    labs: Lab[];
    records: FacultyChoiceRecord[];
    available: StudentType[];
    selected: StudentType[];
  }

  const { round, labs, records, available, selected }: Props = $props();
  const total = $derived(available.length + selected.length);

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
    <Accordion.Root type="multiple">
      <Accordion.Item value="pending-selection">
        <Accordion.Trigger>
          <CheckCircleIcon class="size-5" />
          <span>Pending Selection ({available.length}/{total})</span>
        </Accordion.Trigger>
        <Accordion.Content>
          <div class="flex flex-col gap-2">
            {#each available as { id, ...student } (id)}
              <Student user={student} />
            {/each}
          </div>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="already-drafted">
        <Accordion.Trigger>
          <CircleHelpIcon class="size-5" />
          <span>Already Drafted ({selected.length}/{total})</span>
        </Accordion.Trigger>
        <Accordion.Content>
          <div class="flex flex-col gap-2">
            {#each selected as { id, ...student } (id)}
              <Student user={student} />
            {/each}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  </Tabs.Content>
  <Tabs.Content value="labs">
    <Accordion.Root type="multiple">
      {#each labs as lab (lab.id)}
        <LabAccordionItem {lab} {round} {available} {selected} />
      {/each}
    </Accordion.Root>
  </Tabs.Content>
  <Tabs.Content value="logs">
    <SystemLogsTab {records} />
  </Tabs.Content>
</Tabs.Root>
