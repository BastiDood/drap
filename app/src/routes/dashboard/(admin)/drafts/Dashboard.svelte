<script lang="ts" context="module">
    const enum TabType {
        Students,
        Labs,
        Logs,
    }
</script>

<script lang="ts">
    import { AcademicCap, Beaker, CheckCircle, PaperClip, QuestionMarkCircle } from '@steeze-ui/heroicons';
    import { Accordion, AccordionItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { Icon } from '@steeze-ui/svelte-icon';
    import LabAccordionItem from './LabAccordionItem.svelte';
    import Student from '$lib/users/Student.svelte';
    import SystemLogsTab from './SystemLogsTab.svelte';

    import type { ChoiceRecords, TaggedStudentsWithLabs } from 'drap-database';
    import type { Lab } from 'drap-model/lab';

    // eslint-disable-next-line init-declarations
    export let round: number;
    // eslint-disable-next-line init-declarations
    export let labs: Lab[];
    // eslint-disable-next-line init-declarations
    export let records: ChoiceRecords;
    // eslint-disable-next-line init-declarations
    export let available: TaggedStudentsWithLabs;
    // eslint-disable-next-line init-declarations
    export let selected: TaggedStudentsWithLabs;

    $: total = available.length + selected.length;

    let group = TabType.Students;
</script>

<TabGroup>
    <Tab bind:group name="students" value={TabType.Students}>
        <Icon src={AcademicCap} slot="lead" class="h-8" />
        <span>Registered Students</span>
    </Tab>
    <Tab bind:group name="labs" value={TabType.Labs}>
        <Icon src={Beaker} slot="lead" class="h-8" />
        <span>Laboratories</span>
    </Tab>
    <Tab bind:group name="logs" value={TabType.Logs}>
        <Icon src={PaperClip} slot="lead" class="h-8" />
        <span>System Logs</span>
    </Tab>
    <svelte:fragment slot="panel">
        {#if group === TabType.Students}
            <Accordion>
                <AccordionItem open>
                    <Icon src={CheckCircle} slot="lead" class="h-8" />
                    <span slot="summary">Pending Selection ({available.length}/{total})</span>
                    <svelte:fragment slot="content">
                        {#each available as student}
                            <Student user={student} />
                        {/each}
                    </svelte:fragment>
                </AccordionItem>
                <AccordionItem>
                    <Icon src={QuestionMarkCircle} slot="lead" class="h-8" />
                    <span slot="summary">Already Drafted ({selected.length}/{total})</span>
                    <svelte:fragment slot="content">
                        {#each selected as student}
                            <Student user={student} />
                        {/each}
                    </svelte:fragment>
                </AccordionItem>
            </Accordion>
        {:else if group === TabType.Labs}
            <Accordion>
                {#each labs as lab (lab.lab_id)}
                    <div class="card space-y-4 p-4">
                        <LabAccordionItem {lab} {round} {available} {selected} />
                    </div>
                {/each}
            </Accordion>
        {:else if group === TabType.Logs}
            <SystemLogsTab {records} />
        {:else}
            <ErrorAlert>This is an unexpected tab state. Kindly report this bug.</ErrorAlert>
        {/if}
    </svelte:fragment>
</TabGroup>
