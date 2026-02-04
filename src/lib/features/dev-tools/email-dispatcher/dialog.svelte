<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';

  import EmailDispatcherForm from './form.svelte';

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
      <Dialog.Title>Dispatch Email Event</Dialog.Title>
      <Dialog.Description>
        Send an Inngest event to trigger email notifications. This tool is unavailable in
        production.
      </Dialog.Description>
    </Dialog.Header>
    <EmailDispatcherForm onSuccess={handleSuccess} />
  </Dialog.Content>
</Dialog.Root>
