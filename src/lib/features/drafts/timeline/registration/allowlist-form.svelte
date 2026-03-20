<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { format } from 'date-fns';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import type { DraftRegistrationAllowlistEntry } from '$lib/features/drafts/types';
  import { enhance } from '$app/forms';
  import * as Empty from '$lib/components/ui/empty';
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
    draftId: bigint;
  }

  const { allowlist, draftId }: Props = $props();
</script>

<section class="space-y-4">
  <div class="prose dark:prose-invert">
    <h4>Draft Registration Allowlist</h4>
    <p>Allow specific students to submit rankings after the registration deadline has passed.</p>
  </div>

  <form
    method="post"
    action="/dashboard/drafts/{draftId}/?/add-to-allowlist"
    use:enhance={({ formData, cancel, submitter }) => {
      assert(submitter !== null);
      assert(submitter instanceof HTMLButtonElement);
      submitter.disabled = true;
      return async ({ update, result }) => {
        submitter.disabled = false;
        await update();

        if (result.type === 'success' && result.data) {
          const data = result.data as { status?: string };
          switch (data.status) {
            case 'already_in_allowlist':
              toast.info('Student is already in the allowlist');
              break;
            case 'already_registered':
              toast.info('Student is already registered');
              break;
            case 'added':
              toast.success('Student added to allowlist');
              break;
            default:
              throw new Error('unreachable');
          }
        } else if (result.type === 'failure' && result.status === 400) {
          const data = result.data as { message?: string } | undefined;
          toast.error(data?.message ?? 'Failed to add to allowlist.');
        }
      };
    }}
  >
    <div class="flex gap-2">
      <div class="flex-1">
        <Label for="allowlist-email" class="sr-only">Student Email</Label>
        <Input
          type="email"
          id="allowlist-email"
          name="email"
          placeholder="student@up.edu.ph"
          required
        />
      </div>
      <Button type="submit">
        Add to Allowlist
      </Button>
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
            <TableHead class="w-10"></TableHead>
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
                      if (result.type === 'success')
                        toast.success('Student removed from allowlist.');
                    };
                  }}
                >
                  <input type="hidden" name="studentUserId" value={entry.studentUserId} />
                  <Button type="submit" variant="ghost" size="icon">
                    <TrashIcon class="text-destructive size-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {:else}
      <Empty.Root>
      <Empty.Media variant="icon">
        <UsersIcon class="size-6" />
      </Empty.Media>
      <Empty.Header>
        <Empty.Title>No students on the allowlist</Empty.Title>
        <Empty.Description>
          Add students above to allow them to register after the deadline.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {/if}
</section>
