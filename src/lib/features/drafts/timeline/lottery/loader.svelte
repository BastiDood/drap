<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftLotteryAggregateQuery } from '$lib/queries/fetch-draft-lottery-aggregate';

  import LotteryCompleted from './completed.svelte';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();

  const query = $derived(createFetchDraftLotteryAggregateQuery(draftId));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Lottery Outcome{/snippet}
    {#snippet description()}Fetching lottery aggregate...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive" media={{ icon: CircleAlertIcon, size: 'lg' }}>
    {#snippet title()}Unable to Load Lottery Outcome{/snippet}
    {#snippet description()}Please try again in a moment.{/snippet}
  </Empty>
{:else if typeof query.data !== 'undefined'}
  <LotteryCompleted {draftId} lotteryAggregate={query.data} />
{/if}
