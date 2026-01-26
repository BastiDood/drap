<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';

  import RoleForm, { type Props as FormProps } from './form.svelte';

  interface Props extends FormProps {
    open: boolean;
  }

  let { user, open = $bindable() }: Props = $props();

  function handleSuccess() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Change Role</Dialog.Title>
      <Dialog.Description>
        Modify your admin status and lab assignment for testing purposes only. This tool is
        unavailable in production.
      </Dialog.Description>
    </Dialog.Header>
    <RoleForm {user} onSuccess={handleSuccess} />
  </Dialog.Content>
</Dialog.Root>
