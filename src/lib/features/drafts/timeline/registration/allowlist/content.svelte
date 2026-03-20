<script lang="ts" module>
  export interface Props {
    draftId: string;
    onCountChange?: (count: number) => void;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/ui/empty/empty.svelte';
  import { createFetchDraftAllowlistQuery } from '$lib/queries/fetch-draft-allowlist';

  import AllowlistForm from './form.svelte';

  const { draftId, onCountChange }: Props = $props();

  const query = $derived(createFetchDraftAllowlistQuery(draftId));
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center py-12">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else}
  <AllowlistForm {draftId} allowlist={query.data} {onCountChange} />
{/if}
