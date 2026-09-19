<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import CreateForm from './form.svelte';

  interface Props {
    disabled?: boolean;
    draftId?: bigint;
  }

  const { disabled = false, draftId }: Props = $props();

  let open = $state(false);

  function handleSuccess() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} {disabled}>
        <PlusIcon class="size-4" />
        <span>Create Lab</span>
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Create New Lab</Dialog.Title>
      <Dialog.Description>
        Add a new research laboratory to the system. Labs can be archived later if no longer needed.
      </Dialog.Description>
    </Dialog.Header>
    <CreateForm onSuccess={handleSuccess} {draftId} />
  </Dialog.Content>
</Dialog.Root>
