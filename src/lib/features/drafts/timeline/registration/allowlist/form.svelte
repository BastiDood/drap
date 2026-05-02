<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { format } from 'date-fns';
  import { toast } from 'svelte-sonner';
  import { useQueryClient } from '@tanstack/svelte-query'; // eslint-disable-line no-restricted-imports

  import Empty from '$lib/components/empty.svelte';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import type { DraftRegistrationAllowlistEntry } from '$lib/features/drafts/types';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table';

  interface Props {
    allowlist: DraftRegistrationAllowlistEntry[];
    draftId: string;
  }

  const { allowlist, draftId }: Props = $props();
  const queryClient = useQueryClient();
</script>

<section class="space-y-4">
  <div class="prose dark:prose-invert">
    <h4>Draft Registration Allowlist</h4>
    <p>Allow specific students to submit rankings after the registration deadline has passed.</p>
  </div>

  <form
    method="post"
    action="/dashboard/drafts/{draftId}/?/add-to-allowlist"
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
    <div class="flex gap-2">
      <div class="grow">
        <Label for="allowlist-email" class="sr-only">Student Email</Label>
        <Input
          type="email"
          id="allowlist-email"
          name="email"
          placeholder="student@up.edu.ph"
          required
        />
      </div>
      <Button type="submit">Add to Allowlist</Button>
    </div>
  </form>

  {#if allowlist.length > 0}
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Email</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Added By</TableHead>
            <TableHead>Added At</TableHead>
            <TableHead class="w-10" data-hover="off" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each allowlist as entry (entry.studentUserId)}
            <TableRow>
              <TableCell class="font-medium">{entry.studentEmail}</TableCell>
              <TableCell class="text-muted-foreground">
                {#if entry.submittedAt}
                  {format(entry.submittedAt, 'PPp')}
                {:else}
                  Not yet
                {/if}
              </TableCell>
              <TableCell>{entry.adminEmail}</TableCell>
              <TableCell class="text-muted-foreground">
                {format(entry.createdAt, 'PPp')}
              </TableCell>
              <TableCell>
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
                  <Button type="submit" variant="ghost" size="icon">
                    <TrashIcon class="size-4 text-destructive" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {:else}
    <Empty media={{ icon: UsersIcon, size: 'sm' }}>
      {#snippet title()}No students on the allowlist{/snippet}
      <Button variant="outline" size="sm" href="#allowlist-email">Add a student</Button>
    </Empty>
  {/if}
</section>
