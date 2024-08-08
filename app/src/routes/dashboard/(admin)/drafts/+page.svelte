<script>
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';

    // eslint-disable-next-line init-declarations
    export let data;

    const { draft } = data;

    if (browser) {
        if (draft === null) goto('/dashboard/drafts/start');
        else if (draft.curr_round === null) goto('/dashboard/drafts/lottery');
        else if (draft.curr_round > 0) goto('/dashboard/drafts/regular');
        else goto('/dashboard/drafts/start');
    }
</script>
