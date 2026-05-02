<script lang="ts" module>
  export interface Props {
    draftId: string;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftAllowlistQuery } from '$lib/queries/fetch-draft-allowlist';

  import AllowlistForm from './form.svelte';

  const { draftId }: Props = $props();

  const query = $derived(createFetchDraftAllowlistQuery(draftId));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Allowlist{/snippet}
    {#snippet description()}Fetching allowlist data...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <AllowlistForm {draftId} allowlist={query.data} />
{/if}
