<script>
    import StudentsPanel from './StudentsPanel.svelte';

    import { TabGroup, Tab } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { AcademicCap, Beaker, Clock, PaperClip } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs } = data);

    const { available, selected } = data;
    assert(available !== undefined && selected !== undefined)

    let selectedTab = 0;
</script>

 <!-- TODO: Ongoing Draft (ADMIN DASHBOARD) -->
 <TabGroup>
            
    <!-- Tab Labels -->
    <Tab bind:group={selectedTab} name="tab1" value={0}>
        <Icon src={AcademicCap} slot="lead" class="h-8" />
        <span>Registered Students</span>
    </Tab>
    <Tab bind:group={selectedTab} name="tab2" value={1}>
        <Icon src={Beaker} slot="lead" class="h-8" />
        <span>Lab Submissions</span>
    </Tab>
    <Tab bind:group={selectedTab} name="tab3" value={2}>
        <Icon src={Clock} slot="lead" class="h-8" />
        <span>Draft Start and End</span>
    </Tab>
    <Tab bind:group={selectedTab} name="tab4" value={3}>
        <Icon src={PaperClip} slot="lead" class="h-8" />
        <span>System Logs</span>
    </Tab>
    
    <!-- Tab Panels --->
    <svelte:fragment slot="panel">
        {#if selectedTab === 0}
            <!-- TODO: Registered Students -->
            <StudentsPanel {available} {selected} {labs}/>
        {:else if selectedTab === 1}
            <!-- TODO: Submitted Lab Preferences -->
            (tab panel 2 contents)
        {:else if selectedTab === 2}
            <!-- TODO: Start + End Dates for Draft (?) -->
            (tab panel 3 contents)
        {:else if selectedTab === 3}
            <!-- TODO: System Automation Logs -->
            (tab panel 4 contents)
        {/if}
    </svelte:fragment>

</TabGroup>