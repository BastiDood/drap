<script>
    import { TabGroup, TabAnchor } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { AcademicCap, Beaker, Clock, PaperClip, QueueList } from '@steeze-ui/heroicons';
    import { page } from '$app/stores';

    // eslint-disable-next-line init-declarations
    export let data;
    let { url: { pathname } } = $page;
</script>

 <!-- TODO: Ongoing Draft (ADMIN DASHBOARD) -->
 <TabGroup>
            
    <!-- Tab Labels -->
    <TabAnchor href="/dashboard/drafts/regular/students" selected={$page.url.pathname == "/dashboard/drafts/regular/students/"} name="tab1" value={0}>
        <Icon src={AcademicCap} slot="lead" class="h-8" />
        <span>Registered Students</span>
    </TabAnchor>
    <TabAnchor href="/dashboard/drafts/regular/labs" selected={$page.url.pathname == "/dashboard/drafts/regular/labs/"} name="tab2" value={1}>
        <Icon src={Beaker} slot="lead" class="h-8" />
        <span>Laboratories</span>
    </TabAnchor>
    <TabAnchor href="/dashboard/drafts/regular/preferences" selected={$page.url.pathname == "/dashboard/drafts/regular/preferences/"} name="tab3" value={2}>
        <Icon src={QueueList} slot="lead" class="h-8" />
        <span>Labs Preferences</span>
    </TabAnchor>
    <TabAnchor href="/dashboard/drafts/regular/logs" selected={$page.url.pathname == "/dashboard/drafts/regular/logs/"} name="tab4" value={3}>
        <Icon src={PaperClip} slot="lead" class="h-8" />
        <span>System Logs</span>
    </TabAnchor>
    
    <!-- Tab Panels --->
    <svelte:fragment slot="panel">
        <slot />
    </svelte:fragment>

</TabGroup>