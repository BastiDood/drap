<script lang="ts">
  import CheckCircle from '@lucide/svelte/icons/check-circle';
  import CircleHelp from '@lucide/svelte/icons/circle-help';
  import FlaskConical from '@lucide/svelte/icons/flask-conical';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import type { ComponentProps } from 'svelte';

  import * as Accordion from '$lib/components/ui/accordion';
  import * as Tabs from '$lib/components/ui/tabs';
  import Student from '$lib/users/student.svelte';
  import type { schema } from '$lib/server/database';

  import LabAccordionItem from './lab-accordion-item.svelte';
  import SystemLogsTab from './system-logs-tab.svelte';
  import { TabType } from './tab-type';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota'>;
  type SystemLogsProps = ComponentProps<typeof SystemLogsTab>;
  type StudentPropsUser = ComponentProps<typeof Student>['user'];

  interface StudentUser extends StudentPropsUser {
    id: schema.User['id'];
  }

  interface Props {
    round: number;
    labs: Lab[];
    records: SystemLogsProps['records'];
    available: StudentUser[];
    selected: StudentUser[];
  }

  const { round, labs, records, available, selected }: Props = $props();
  const total = $derived(available.length + selected.length);

  let group = $state(TabType.Students);
</script>

<Tabs.Root
  value={group}
  onValueChange={value => {
    switch (value) {
      case TabType.Students:
      case TabType.Labs:
      case TabType.Logs:
        group = value;
        break;
      default:
        break;
    }
  }}
>
  <Tabs.List>
    <Tabs.Trigger value={TabType.Students}>
      <GraduationCap class="size-5" />
      <span>Registered Students</span>
    </Tabs.Trigger>
    <Tabs.Trigger value={TabType.Labs}>
      <FlaskConical class="size-5" />
      <span>Laboratories</span>
    </Tabs.Trigger>
    <Tabs.Trigger value={TabType.Logs}>
      <Paperclip class="size-5" />
      <span>System Logs</span>
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value={TabType.Students}>
    <Accordion.Root type="multiple">
      <Accordion.Item value="pending-selection">
        <Accordion.Trigger>
          <CheckCircle class="size-5" />
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
          <CircleHelp class="size-5" />
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
  <Tabs.Content value={TabType.Labs}>
    <Accordion.Root type="multiple">
      {#each labs as lab (lab.id)}
        <LabAccordionItem {lab} {round} {available} {selected} />
      {/each}
    </Accordion.Root>
  </Tabs.Content>
  <Tabs.Content value={TabType.Logs}>
    <SystemLogsTab {records} />
  </Tabs.Content>
</Tabs.Root>
