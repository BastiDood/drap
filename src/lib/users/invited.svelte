<script lang="ts">
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { toast } from 'svelte-sonner';
  // eslint-disable-next-line no-restricted-imports
  import { useQueryClient } from '@tanstack/svelte-query';

  import * as Tooltip from '$lib/components/ui/tooltip';
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import { assert } from '$lib/assert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database/drizzle';

  interface User extends Pick<
    schema.User,
    'id' | 'givenName' | 'familyName' | 'email' | 'avatarUrl'
  > {
    labId: string | null;
  }

  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { id, givenName, familyName, email, avatarUrl, labId } = $derived(user);

  const queryClient = useQueryClient();
</script>

<UserlistItem
  {familyName}
  {givenName}
  avatar={{ variant: 'profile', url: avatarUrl, alt: `${givenName} ${familyName}` }}
  {email}
  class="border border-dashed p-3 opacity-80 transition-opacity hover:opacity-100"
>
  {#snippet badges()}
    {#if labId !== null}
      <Badge variant="secondary" class="shrink-0 text-xs uppercase">{labId}</Badge>
    {/if}
  {/snippet}

  {#snippet actionButtons()}
    <form
      method="POST"
      action="/dashboard/users/?/delete-invite"
      use:enhance={({ submitter, cancel }) => {
        // eslint-disable-next-line no-alert
        if (!confirm('Are you sure you want to delete this invitation?')) {
          cancel();
          return;
        }

        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;

        return async ({ result, update }) => {
          submitter.disabled = false;
          await update();
          await queryClient.invalidateQueries({ queryKey: ['users', 'invited'] });
          switch (result.type) {
            case 'success':
              toast.success('Invitation deleted.');
              break;
            case 'error':
              assert(result.status === 404);
              toast.error('Invitation no longer exists.');
              break;
            default:
              break;
          }
        };
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Tooltip.Provider delayDuration={150}>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button {...props} type="submit" variant="destructive" size="icon-sm">
                <Trash2Icon class="size-4" />
                <span class="sr-only">Delete Invitation</span>
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="top">
            <p>Delete Invitation</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </form>
  {/snippet}
</UserlistItem>
