<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { format } from 'date-fns';
  import { toast } from 'svelte-sonner';

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
    draftId: bigint;
  }

  const { allowlist, draftId }: Props = $props();

  let email = $state('');
  let adding = $state(false);
</script>

<section class="space-y-4">
  <div class="prose dark:prose-invert">
    <h4>Draft Registration Allowlist</h4>
    <p>Allow specific students to submit rankings after the registration deadline has passed.</p>
  </div>

  <form
    method="post"
    action="/dashboard/drafts/{draftId}/?/allowlist"
    use:enhance={({ formData }) => {
      const emailValue = formData.get('email');
      if (typeof emailValue !== 'string' || emailValue.length === 0) return;

      adding = true;
      return async ({ update, result }) => {
        adding = false;
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
              email = '';
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
    <input type="hidden" name="draft" value={draftId} />
    <input type="hidden" name="intent" value="add" />
    <div class="flex gap-2">
      <div class="flex-1">
        <Label for="allowlist-email" class="sr-only">Student Email</Label>
        <Input
          type="email"
          id="allowlist-email"
          name="email"
          placeholder="student@up.edu.ph"
          bind:value={email}
          required
        />
      </div>
      <Button type="submit" disabled={adding}>
        {adding ? 'Adding...' : 'Add to Allowlist'}
      </Button>
    </div>
  </form>

  {#if allowlist.length > 0}
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Email</TableHead>
            <TableHead>Added By</TableHead>
            <TableHead>Added At</TableHead>
            <TableHead class="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each allowlist as entry (entry.studentUserId)}
            <TableRow>
              <TableCell class="font-medium">{entry.email}</TableCell>
              <TableCell>{entry.adminEmail}</TableCell>
              <TableCell class="text-muted-foreground">
                {format(entry.createdAt, 'PPp')}
              </TableCell>
              <TableCell>
                <form
                  method="post"
                  action="/dashboard/drafts/{draftId}/?/allowlist"
                  use:enhance={({ submitter }) => {
                    if (submitter instanceof HTMLButtonElement) submitter.disabled = true;

                    return async ({ update, result }) => {
                      await update();
                      if (result.type === 'success')
                        toast.success('Student removed from allowlist.');
                    };
                  }}
                >
                  <input type="hidden" name="draftId" value={draftId} />
                  <input type="hidden" name="intent" value="remove" />
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
    <p class="text-muted-foreground text-sm">No students on the allowlist.</p>
  {/if}
</section>
