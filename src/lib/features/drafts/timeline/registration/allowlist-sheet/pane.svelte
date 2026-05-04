<script lang="ts" module>
  export interface Props {
    draftId: string;
    allowlist: DraftRegistrationAllowlistEntry[];
  }
</script>

<script lang="ts">
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UserCircleIcon from '@lucide/svelte/icons/circle-user';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { format } from 'date-fns';
  import { toast } from 'svelte-sonner';
  import { useQueryClient } from '@tanstack/svelte-query'; // eslint-disable-line no-restricted-imports

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import Empty from '$lib/components/empty.svelte';
  import Link from '$lib/components/link.svelte';
  import { assert } from '$lib/assert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import type { DraftRegistrationAllowlistEntry } from '$lib/features/drafts/types';
  import { enhance } from '$app/forms';

  import AllowlistForm from './form.svelte';

  const { draftId, allowlist }: Props = $props();
  const queryClient = useQueryClient();
</script>

<div class="flex min-h-0 grow flex-col gap-6">
  <div class="shrink-0">
    <AllowlistForm {draftId} />
  </div>
  <div class="flex min-h-0 grow flex-col gap-4 overflow-y-auto">
    {#if allowlist.length === 0}
      <Empty media={{ icon: UsersIcon, size: 'sm' }}>
        {#snippet title()}No students on the allowlist{/snippet}
        {#snippet description()}Added students will appear here.{/snippet}
      </Empty>
    {:else}
      {#each allowlist as entry (entry.studentUserId)}
        <div
          class="flex items-center justify-between gap-4 rounded-md border border-dashed p-3 opacity-80 transition-opacity hover:opacity-100"
        >
          <div class="flex min-w-0 items-center gap-3 overflow-hidden">
            <Avatar.Root class="size-10 shrink-0">
              <Avatar.Fallback>
                <UserCircleIcon class="size-10 text-muted-foreground" />
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="min-w-0 space-y-1">
              <a
                href="mailto:{entry.studentEmail}"
                class="block truncate text-sm font-semibold hover:underline"
              >
                {entry.studentEmail}
              </a>
              <div
                class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
              >
                <span>
                  Added <time datetime={entry.createdAt.toISOString()}>
                    {format(entry.createdAt, 'PPp')}
                  </time>
                </span>
                <span>
                  by <Link href="mailto:{entry.adminEmail}" class="font-medium">
                    {entry.adminGivenName}
                    {entry.adminFamilyName}
                  </Link>
                </span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            {#if entry.submittedAt === null}
              <Badge variant="outline" class="text-xs">Pending</Badge>
            {:else}
              <Badge variant="secondary" class="text-xs">Submitted</Badge>
            {/if}
            <form
              method="post"
              action="/dashboard/drafts/{draftId}/?/remove-from-allowlist"
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
                      toast.success('Student removed from allowlist.');
                      break;
                    default:
                      break;
                  }
                };
              }}
            >
              <input type="hidden" name="studentUserId" value={entry.studentUserId} />
              <Tooltip.Provider delayDuration={150}>
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Button {...props} type="submit" variant="destructive" size="icon-sm">
                        <Trash2Icon class="size-4" />
                        <span class="sr-only">Remove from Allowlist</span>
                      </Button>
                    {/snippet}
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top">
                    <p>Remove from Allowlist</p>
                  </Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            </form>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
