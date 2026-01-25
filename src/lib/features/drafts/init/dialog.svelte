<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';

  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';

  import InitForm from './form.svelte';

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
        <span>Create Draft</span>
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Create New Draft</Dialog.Title>
      <Dialog.Description>
        Configure the parameters for the new draft. Once created, students will be able to register
        until the closing date.
      </Dialog.Description>
    </Dialog.Header>
    <InitForm onSuccess={handleSuccess} />
  </Dialog.Content>
</Dialog.Root>
