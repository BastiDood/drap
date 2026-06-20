<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';
  import { SvelteSet } from 'svelte/reactivity';
  import { toast } from 'svelte-sonner';

  import * as Popover from '$lib/components/ui/popover';
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import { assert } from '$lib/assert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Progress } from '$lib/components/ui/progress';
  import type { schema } from '$lib/server/database/drizzle';

  interface Student extends Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'studentNumber'
  > {
    avatarObjectKey: schema.StudentRank['avatarObjectKey'];
    remark: schema.StudentRankLab['remark'];
  }

  interface Props {
    draft: schema.Draft['id'];
    round: number;
    students: Student[];
    remainingQuota: number;
    initialSelectedIds?: string[];
    hasExistingSubmission?: boolean;
  }

  const {
    draft,
    round,
    students,
    remainingQuota,
    initialSelectedIds = [],
    hasExistingSubmission = false,
  }: Props = $props();

  const addedIds = new SvelteSet<string>();
  const removedIds = new SvelteSet<string>();
  const selectedIds = $derived.by(() => {
    const ids: string[] = [];
    for (const id of initialSelectedIds) if (!removedIds.has(id)) ids.push(id);
    for (const id of addedIds) if (!initialSelectedIds.includes(id)) ids.push(id);
    return ids;
  });

  const disabled = $derived(remainingQuota - selectedIds.length < 0);

  function toggleSelection(id: string) {
    if (initialSelectedIds.includes(id)) {
      if (removedIds.has(id)) removedIds.delete(id);
      else removedIds.add(id);
      return;
    }

    if (addedIds.has(id)) addedIds.delete(id);
    else addedIds.add(id);
  }

  function hasSelection(id: string) {
    return (initialSelectedIds.includes(id) && !removedIds.has(id)) || addedIds.has(id);
  }

  function resetSelectionState() {
    addedIds.clear();
    removedIds.clear();
  }
</script>

<form
  method="post"
  action="/dashboard/students/?/rankings"
  use:enhance={({ formData, submitter, cancel }) => {
    const count = formData.getAll('students').length;

    let message: string;
    switch (count) {
      case 0:
        message = 'Are you sure you want to waive this round?';
        break;
      case 1:
        message = 'Are you sure you want to select only one student?';
        break;
      default:
        message = `Are you sure you want to select these ${count} students?`;
        break;
    }

    // eslint-disable-next-line no-alert
    if (!confirm(message)) {
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
          toast.success('Selections submitted.');
          break;
        case 'error':
          switch (result.status) {
            case 409:
              toast.error('Round advanced while editing. No changes saved.');
              break;
            case 403:
              toast.error('Draft is inactive or in the lottery phase. No changes saved.');
              break;
            default:
              toast.error('An unexpected error occurred.');
              break;
          }
          break;
        case 'failure':
          if (result.status === 409) toast.error('Round advanced while editing. No changes saved.');
          else toast.error('Failed to submit selections.');
          break;
        default:
          break;
      }

      resetSelectionState();
    };
  }}
  class="flex min-h-0 grow flex-col inert:opacity-20"
>
  <input type="hidden" name="draft" value={draft} />
  <input type="hidden" name="round" value={round} />
  {#each selectedIds as id (id)}
    <input type="hidden" name="students" value={id} />
  {/each}
  <div id="selection-progress" class="flex items-center gap-3 pb-3">
    <Progress value={selectedIds.length} max={remainingQuota} />
    <Badge variant="secondary" class="tabular-nums"
      >{selectedIds.length}/{remainingQuota} Slots</Badge
    >
  </div>
  <ul class="min-h-0 grow space-y-2 overflow-y-auto">
    {#each students as { id, email, givenName, familyName, avatarObjectKey, studentNumber, remark } (id)}
      {@const selected = hasSelection(id)}
      <li data-selected={selected}>
        <button type="button" onclick={toggleSelection.bind(null, id)} class="w-full">
          <UserlistItem
            {email}
            {givenName}
            {familyName}
            {studentNumber}
            avatar={{
              variant: 'draft',
              objectKey: avatarObjectKey,
              alt: `${givenName} ${familyName}`,
            }}
            remarks={remark.length > 0 ? remark : null}
            remarksIcon={MessageSquareTextIcon}
            class={selected
              ? 'border border-primary/40 dark:bg-primary/20 bg-primary/15 transition-colors duration-150'
              : 'border border-transparent bg-muted transition-colors duration-150 hover:bg-muted/60'}
          ></UserlistItem>
        </button>
      </li>
    {/each}
  </ul>
  <div class="flex items-center gap-2 pt-3">
    {#if hasExistingSubmission}
      <Button type="submit" variant="outline" class="grow" {disabled}>Update Selection</Button>
    {:else}
      <Button type="submit" class="grow" {disabled}>Submit Selection</Button>
    {/if}
    <Popover.Root>
      <Popover.Trigger>
        <CircleHelpIcon class="size-4 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Content class="text-sm">
        Empty submissions allowed. You may amend selections while this round is active. Once all
        labs submit and the round advances, changes become irreversible.
      </Popover.Content>
    </Popover.Root>
  </div>
</form>
