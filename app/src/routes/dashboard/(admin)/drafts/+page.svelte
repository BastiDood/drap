<script>
    import Student from '$lib/users/Student.svelte';
    import { format } from 'date-fns';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    import ConcludeForm from './ConcludeForm.svelte';
    import InterveneForm from './InterveneForm.svelte';
    import StartForm from './StartForm.svelte';
    import StudentsPanel from './StudentsPanel.svelte';

    import { Tab, TabAnchor, TabGroup } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { AcademicCap, Beaker, Clock, PaperClip } from '@steeze-ui/heroicons';

    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs } = data);

    const { draft } = data;

    const selectedTab = 0;

    if (browser) {
        if (draft === null) goto('/dashboard/drafts/start');
        else if (draft.curr_round === null) goto('/dashboard/drafts/lottery');
        else if (draft.curr_round > 0) goto('/dashboard/drafts/regular');
        else goto('/dashboard/drafts/start');
    }
</script>
