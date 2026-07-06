<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import * as Card from '$lib/components/ui/card';
  import DrafteesSheet from '$lib/features/drafts/timeline/registration/draftees-sheet/index.svelte';
  import Empty from '$lib/components/empty.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { createFetchDraftRegistrationTimestampsQuery } from '$lib/queries/fetch-draft-registration-timestamps';

  import RegistrantsChart from './chart.svelte';
  interface Props {
    draftId: string;
    draftCreatedAt: Date;
    registrationClosedAt: Date;
    startedAt: Date | null;
    requestedAt: Date;
  }

  const { draftId, draftCreatedAt, registrationClosedAt, startedAt, requestedAt }: Props = $props();

  const query = $derived(createFetchDraftRegistrationTimestampsQuery(draftId));
</script>

<Card.Root
  class="@container overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
>
  <Card.Header class="gap-5">
    <div class="flex flex-col gap-4 @5xl:flex-row @5xl:items-start @5xl:justify-between">
      <div class="space-y-1.5 @5xl:flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <Card.Title>Registrants per Day</Card.Title>
          <Badge variant="default">Draft Creation to Start</Badge>
        </div>
        <Card.Description>Shows how many students registered each day</Card.Description>
      </div>
      <div class="flex w-full flex-col gap-2 @lg:w-auto @lg:flex-row @lg:gap-2">
        <DrafteesSheet {draftId} />
      </div>
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    {#if query.isPending}
      <Empty
        class="h-[500px] w-full"
        media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}
      >
        {#snippet title()}Loading Registration Timeline{/snippet}
        {#snippet description()}Fetching registration timestamps...{/snippet}
      </Empty>
    {:else if query.isError}
      <Empty
        variant="destructive"
        class="h-[500px] w-full"
        media={{ icon: CircleAlertIcon, size: 'lg' }}
      >
        {#snippet title()}Failed to Load Registration Timeline{/snippet}
        {#snippet description()}Please try again in a moment.{/snippet}
      </Empty>
    {:else if typeof query.data !== 'undefined'}
      <RegistrantsChart
        {draftCreatedAt}
        {registrationClosedAt}
        {startedAt}
        {requestedAt}
        registrationTimestamps={query.data}
      />
    {/if}
  </Card.Content>
</Card.Root>
