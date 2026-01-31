<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';

  import DummyUserForm, { type Props as FormProps } from './form.svelte';

  interface Props extends FormProps {
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
      <Dialog.Title>Create Dummy User</Dialog.Title>
      <Dialog.Description>
        Create a new test user. Your current session will be swapped to the new user. This tool is
        unavailable in production.
      </Dialog.Description>
    </Dialog.Header>
    <DummyUserForm onSuccess={handleSuccess} />
  </Dialog.Content>
</Dialog.Root>
