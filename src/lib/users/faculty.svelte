<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import UserCircleIcon from '@lucide/svelte/icons/circle-user';
  import { toast } from 'svelte-sonner';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database/drizzle';

  interface User extends Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl'
  > {
    labName: string | null;
  }

  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { id, email, givenName, familyName, avatarUrl, labName } = $derived(user);
</script>

<div class="block h-full">
  <Card.Root class="flex h-full flex-col justify-center items-center gap-4 p-4 text-center">
    <Avatar.Root class="size-16">
      <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
      <Avatar.Fallback>
        <UserCircleIcon class="size-16 text-muted-foreground" />
      </Avatar.Fallback>
    </Avatar.Root>
    <div class="flex flex-col gap-1">
      {#if givenName.length > 0 && familyName.length > 0}
        <Card.Title class="text-base font-semibold"
          ><span class="uppercase">{familyName}</span>, {givenName}</Card.Title
        >
      {/if}
      <div class="flex flex-col gap-0.5">
        {#if labName !== null}
          <span class="text-sm font-medium text-foreground">{labName}</span>
        {/if}
        <a href="mailto:{email}" class="text-xs text-muted-foreground hover:underline">
          {email}
        </a>
      </div>
    </div>
    <Card.Footer class="w-full flex justify-center p-0">
      <form
        method="post"
        action="/dashboard/users/?/demote-head"
        use:enhance={({ submitter, cancel }) => {
          // eslint-disable-next-line no-alert
          if (
            !confirm(
              `Are you sure you want to demote ${givenName} ${familyName} as a lab faculty member?`,
            )
          ) {
            cancel();
            return;
          }
          assert(submitter !== null);
          assert(submitter instanceof HTMLButtonElement);
          submitter.disabled = true;
          return async ({ update, result }) => {
            submitter.disabled = false;
            await update();
            switch (result.type) {
              case 'success':
                toast.success(`${givenName} ${familyName} demoted as a lab faculty member.`);
                break;
              case 'failure':
                toast.error('Failed to demote lab head.');
                break;
              default:
                break;
            }
          };
        }}
      >
        <input type="hidden" name="userId" value={id} />
        <Button
          type="submit"
          variant="destructive"
          class="h-auto max-w-full gap-2 py-2 text-left leading-tight whitespace-normal"
        >
          <ArrowDownIcon class="size-6 @lg:size-4" />
          <span>Demote</span>
        </Button>
      </form>
    </Card.Footer>
  </Card.Root>
</div>
