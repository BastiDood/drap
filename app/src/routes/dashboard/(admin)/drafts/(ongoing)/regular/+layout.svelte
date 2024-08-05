<script>
    import { TabGroup, TabAnchor } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { AcademicCap, Beaker, Clock, PaperClip } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';
    import { page } from '$app/stores';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs } = data);

    const { available, selected } = data;
    assert(available !== undefined && selected !== undefined)
</script>

 <!-- TODO: Ongoing Draft (ADMIN DASHBOARD) -->
 <TabGroup>
            
    <!-- Tab Labels -->
    <TabAnchor href="../students" selected={$page.url.pathname.split("/").reverse()[1] === "students"} name="tab1" value={0}>
        <Icon src={AcademicCap} slot="lead" class="h-8" />
        <span>Registered Students</span>
    </TabAnchor>
    <TabAnchor href="../preferences" selected={$page.url.pathname.split("/").reverse()[1] === "preferences"} name="tab2" value={1}>
        <Icon src={Beaker} slot="lead" class="h-8" />
        <span>Lab Submissions</span>
    </TabAnchor>
    <TabAnchor href="../logs" selected={$page.url.pathname.split("/").reverse()[1] === "logs"} name="tab3" value={2}>
        <Icon src={PaperClip} slot="lead" class="h-8" />
        <span>System Logs</span>
    </TabAnchor>
    
    <!-- Tab Panels --->
    <svelte:fragment slot="panel">
        <slot />
    </svelte:fragment>

</TabGroup>