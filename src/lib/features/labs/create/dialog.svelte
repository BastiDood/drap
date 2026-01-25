<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';

  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';

  import CreateForm from './form.svelte';

  let open = $state(false);

  function handleSuccess() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props}>
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
    <CreateForm onSuccess={handleSuccess} />
  </Dialog.Content>
</Dialog.Root>
