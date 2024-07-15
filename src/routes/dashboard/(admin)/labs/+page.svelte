<script lang="ts">
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { format } from 'date-fns';

    import CreateForm from './CreateForm.svelte';
    import QuotaForm from './QuotaForm.svelte';

    // eslint-disable-next-line
    export let data;
    $: ({ draft, labs } = data);
</script>

{#if draft === null || draft.curr_round === null}
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[56ch_1fr]">
        <CreateForm />
        <QuotaForm {labs} />
    </div>
{:else}
    {@const { draft_id, active_period_start, curr_round, max_rounds } = draft}
    {@const startDate = format(active_period_start, 'PPP')}
    {@const startTime = format(active_period_start, 'pp')}
    <WarningAlert>
        <span>
            <strong>Draft &num;{draft_id}</strong> started last <strong>{startDate}</strong> at
            <strong>{startTime}</strong> and is now in Round <strong>{curr_round}</strong> of
            <strong>{max_rounds}</strong>. It's unsafe to update the lab quota while a draft is in progress.
        </span>
    </WarningAlert>
{/if}
