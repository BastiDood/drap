<script lang="ts">
  import {
    AcademicCap,
    Beaker,
    CheckCircle,
    PaperClip,
    QuestionMarkCircle,
  } from '@steeze-ui/heroicons';
  import { Accordion, Tabs } from '@skeletonlabs/skeleton-svelte';
  import type { ComponentProps } from 'svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import LabAccordionItem from './LabAccordionItem.svelte';
  import Student from '$lib/users/Student.svelte';
  import SystemLogsTab from './SystemLogsTab.svelte';
  import { TabType } from './TabType';
  import type { schema } from '$lib/server/database';

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

<Tabs
  value={group}
  onValueChange={({ value }) => {
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
  {#snippet list()}
    <Tabs.Control value={TabType.Students}>
      <Icon src={AcademicCap} class="h-8" />
      <span>Registered Students</span>
    </Tabs.Control>
    <Tabs.Control value={TabType.Labs}>
      <Icon src={Beaker} class="h-8" />
      <span>Laboratories</span>
    </Tabs.Control>
    <Tabs.Control value={TabType.Logs}>
      <Icon src={PaperClip} class="h-8" />
      <span>System Logs</span>
    </Tabs.Control>
  {/snippet}
  {#snippet content()}
    <Tabs.Panel value={TabType.Students}>
      <Accordion multiple>
        <Accordion.Item value="pending-selection">
          {#snippet lead()}
            <Icon src={CheckCircle} class="h-8" />
          {/snippet}
          {#snippet control()}
            <span>Pending Selection ({available.length}/{total})</span>
          {/snippet}
          {#snippet panel()}
            <div class="flex flex-col gap-2">
              {#each available as { id, ...student } (id)}
                <Student user={student} />
              {/each}
            </div>
          {/snippet}
        </Accordion.Item>
        <Accordion.Item value="already-drafted">
          {#snippet lead()}
            <Icon src={QuestionMarkCircle} class="h-8" />
          {/snippet}
          {#snippet control()}
            <span>Already Drafted ({selected.length}/{total})</span>
          {/snippet}
          {#snippet panel()}
            <div class="flex flex-col gap-2">
              {#each selected as { id, ...student } (id)}
                <Student user={student} />
              {/each}
            </div>
          {/snippet}
        </Accordion.Item>
      </Accordion>
    </Tabs.Panel>
    <Tabs.Panel value={TabType.Labs}>
      <Accordion multiple collapsible>
        {#each labs as lab (lab.id)}
          <LabAccordionItem {lab} {round} {available} {selected} />
        {/each}
      </Accordion>
    </Tabs.Panel>
    <Tabs.Panel value={TabType.Logs}>
      <SystemLogsTab {records} />
    </Tabs.Panel>
  {/snippet}
</Tabs>
