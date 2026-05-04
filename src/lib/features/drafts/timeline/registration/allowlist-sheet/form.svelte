<script lang="ts">
  import SendIcon from '@lucide/svelte/icons/send';
  import { toast } from 'svelte-sonner';
  import { useQueryClient } from '@tanstack/svelte-query'; // eslint-disable-line no-restricted-imports

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();
  const queryClient = useQueryClient();
</script>

<form
  method="post"
  action="/dashboard/drafts/{draftId}/?/add-to-allowlist"
  class="space-y-2"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      await queryClient.invalidateQueries({ queryKey: ['drafts', draftId] });
      switch (result.type) {
        case 'success':
          toast.success('Student added to allowlist');
          break;
        case 'failure': {
          switch (result.data?.status) {
            case 'already-in-allowlist':
              toast.info('Student is already in the allowlist');
              break;
            case 'already-registered':
              toast.info('Student is already registered');
              break;
            case 'not-a-student':
              toast.info('User is not a student');
              break;
            case 'user-not-found':
              toast.info('User with this email is not found.');
              break;
            default:
              toast.error('Failed to add to allowlist.');
          }
          break;
        }
        case 'error':
          toast.error('Failed to add to allowlist.');
          break;
        default:
          break;
      }
    };
  }}
>
  <div class="space-y-2">
    <Label for="allowlist-email">Student Email</Label>
    <div class="flex overflow-hidden rounded-md border border-input">
      <div class="flex items-center bg-muted px-3"><SendIcon class="size-5" /></div>
      <Input
        type="email"
        id="allowlist-email"
        name="email"
        placeholder="student@up.edu.ph"
        required
        class="grow rounded-none border-0"
      />
      <Button type="submit" class="rounded-l-none">Add to Allowlist</Button>
    </div>
  </div>
</form>
