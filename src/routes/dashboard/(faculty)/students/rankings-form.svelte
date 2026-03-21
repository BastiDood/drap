<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { SvelteSet } from 'svelte/reactivity';
  import { toast } from 'svelte-sonner';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Popover from '$lib/components/ui/popover';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Progress } from '$lib/components/ui/progress';
  import type { schema } from '$lib/server/database/drizzle';

  interface Student extends Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  > {
    remark: schema.StudentRankLab['remark'];
  }

  interface Props {
    draft: schema.Draft['id'];
    round: number;
    students: Student[];
    remainingQuota: number;
    initialSelectedIds?: string[];
    submitLabel?: string;
    onCancel?: () => void;
    onSuccess?: () => void;
  }

  const {
    draft,
    round,
    students,
    remainingQuota,
    initialSelectedIds = [],
    submitLabel,
    onCancel,
    onSuccess,
  }: Props = $props();

  const addedIds = new SvelteSet<string>();
  const removedIds = new SvelteSet<string>();
  const selectedIds = $derived([
    ...initialSelectedIds.filter(id => !removedIds.has(id)),
    ...Array.from(addedIds, id => (initialSelectedIds.includes(id) ? null : id)).filter(
      (id): id is string => id !== null,
    ),
  ]);
  const disabled = $derived(remainingQuota - selectedIds.length < 0);
  const editing = $derived(initialSelectedIds.length > 0);

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
</script>

<form
  method="post"
  action="/dashboard/students/?/rankings"
  use:enhance={({ formData, submitter, cancel }) => {
    const count = formData.getAll('students').length;
    // eslint-disable-next-line no-alert
    const confirmed = confirm(
      editing
        ? `Are you sure you want to update your selections to ${count} students?`
        : `Are you sure you want to select these ${count} students?`,
    );
    if (!confirmed) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      if (result.type === 'error' && result.status === 409) {
        toast.error('Round advanced while editing. No changes saved. Refreshing...');
        addedIds.clear();
        removedIds.clear();
        onSuccess?.();
        await invalidateAll();
        return;
      }
      await update();
      switch (result.type) {
        case 'success':
          toast.success(editing ? 'Selections updated.' : 'Selections submitted.');
          addedIds.clear();
          removedIds.clear();
          onSuccess?.();
          break;
        case 'failure':
          toast.error(editing ? 'Failed to update selections.' : 'Failed to submit selections.');
          break;
        default:
          break;
      }
    };
  }}
  class="flex flex-col gap-4 inert:opacity-20"
>
  <input type="hidden" name="draft" value={draft} />
  <input type="hidden" name="round" value={round} />
  {#each selectedIds as id (id)}
    <input type="hidden" name="students" value={id} />
  {/each}
  <ul class="space-y-1">
    {#each students as { id, email, givenName, familyName, avatarUrl, studentNumber, remark } (id)}
      {@const selected = hasSelection(id)}
      <li
        data-selected={selected}
        class="cursor-pointer rounded-md bg-muted transition-colors duration-150 hover:bg-muted/80 data-[selected=true]:bg-primary/20"
      >
        <button
          type="button"
          class="flex w-full flex-col gap-3 p-2"
          onclick={toggleSelection.bind(void 0, id)}
        >
          <div class="flex items-center gap-3 p-2">
            <Avatar.Root class="size-10">
              <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
              <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
            </Avatar.Root>
            <div class="flex flex-col">
              <strong class="text-start"
                ><span class="uppercase">{familyName}</span>, {givenName}</strong
              >
              {#if studentNumber !== null}
                <span class="text-start text-sm opacity-50">{studentNumber}</span>
              {/if}
              <span class="text-start text-xs opacity-50">{email}</span>
            </div>
          </div>
          {#if remark.length > 0}
            <div class="flex flex-col gap-2">
              <span class="text-start"><strong>Remarks</strong></span>
              <pre
                class="text-start font-sans text-sm whitespace-pre-wrap opacity-90">{remark}</pre>
            </div>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
  <div id="selection-progress" class="flex items-center gap-3">
    <Progress value={selectedIds.length} max={remainingQuota} />
    <span class="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
      {selectedIds.length} / {remainingQuota} slots
    </span>
  </div>
  <div class="flex items-center gap-2">
    <Button type="submit" class="grow" {disabled}
      >{submitLabel ?? (editing ? 'Update Selection' : 'Submit')}</Button
    >
    {#if typeof onCancel !== 'undefined'}
      <Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
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
