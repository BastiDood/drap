<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';

  import CreateForm from './create-form.svelte';
  import QuotaForm from './quota-form.svelte';
  import RestoreForm from './restore-form.svelte';

  const { data } = $props();
  const { draft, labs } = $derived(data);

  const { deletedLabs = [], activeLabs = [] } = $derived(
    Object.groupBy(labs, ({ deletedAt }) => (deletedAt === null ? 'activeLabs' : 'deletedLabs')),
  );

  let isRestoreFormVisible = $state(false);
</script>

{#if typeof draft === 'undefined' || draft.currRound === null}
  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[56ch_1fr]">
    <CreateForm />
    <div class="flex w-full flex-col gap-y-4">
      <Button
        variant="secondary"
        class="w-48"
        onclick={() => {
          isRestoreFormVisible = !isRestoreFormVisible;
        }}
      >
        {#if isRestoreFormVisible}
          Set Lab Quotas
        {:else}
          See Deleted Labs
        {/if}
      </Button>
      {#if isRestoreFormVisible}
        <RestoreForm {deletedLabs} />
      {:else}
        <QuotaForm {activeLabs} isDeleteAllowed />
      {/if}
    </div>
  </div>
{:else if draft.currRound === 0}
  <QuotaForm {activeLabs} isDeleteAllowed={false} />
{:else}
  {@const { id: draftId, activePeriodStart, currRound, maxRounds } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <Alert.Root variant="warning">
    <TriangleAlertIcon />
    <Alert.Description>
      <strong>Draft #{draftId}</strong> started last <strong>{startDate}</strong> at
      <strong>{startTime}</strong> and is now in Round <strong>{currRound}</strong> of
      <strong>{maxRounds}</strong>. It's unsafe to update the lab quota while a draft is in
      progress.
    </Alert.Description>
  </Alert.Root>
{/if}
