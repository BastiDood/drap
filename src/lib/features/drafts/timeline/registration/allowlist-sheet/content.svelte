<script lang="ts" module>
  export interface Props {
    draftId: string;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import UsersIcon from '@lucide/svelte/icons/users';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftAllowlistQuery } from '$lib/queries/fetch-draft-allowlist';

  import Pane from './pane.svelte';

  const { draftId }: Props = $props();

  const query = $derived(createFetchDraftAllowlistQuery(draftId));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'sm', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Allowlist{/snippet}
    {#snippet description()}Fetching allowlist data...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive" media={{ icon: UsersIcon, size: 'sm' }}>
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Please try again in a moment.{/snippet}
  </Empty>
{:else}
  <Pane {draftId} allowlist={query.data} />
{/if}
