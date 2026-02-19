<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';

  import UserForm from './form.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  function handleSuccess() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Switch to Another User</Dialog.Title>
      <Dialog.Description>
        Switch to another user for testing purposes only. This tool is unavailable in production.
      </Dialog.Description>
    </Dialog.Header>
    <UserForm onSuccess={handleSuccess} />
  </Dialog.Content>
</Dialog.Root>
