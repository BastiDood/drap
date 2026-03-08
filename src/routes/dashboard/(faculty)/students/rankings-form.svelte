<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { SvelteSet } from 'svelte/reactivity';
  import { toast } from 'svelte-sonner';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Popover from '$lib/components/ui/popover';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Progress } from '$lib/components/ui/progress';
  import type { schema } from '$lib/server/database/drizzle';

  interface Student extends Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  > {
    remark: schema.StudentRankLab['remark'];
  }

  interface Props {
    disabled: boolean;
    draft: schema.Draft['id'];
    students: Student[];
    drafteeIds: SvelteSet<schema.User['id']>;
    remainingQuota: number;
  }

  let { disabled, draft, students, drafteeIds = $bindable(), remainingQuota }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/students/?/rankings"
  use:enhance={({ formData, submitter, cancel }) => {
    const count = formData.getAll('students').length;
    // eslint-disable-next-line no-alert
    if (!confirm(`Are you sure you want to select these ${count} students?`)) {
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
        case 'failure':
          toast.error('Failed to submit selections.');
          break;
        default:
          break;
      }
    };
  }}
  class="flex flex-col gap-4 inert:opacity-20"
>
  <input type="hidden" name="draft" value={draft} />
  {#each drafteeIds as id (id)}
    <input type="hidden" name="students" value={id} />
  {/each}
  <ul class="space-y-1">
    {#each students as { id, email, givenName, familyName, avatarUrl, studentNumber, remark } (id)}
      {@const selected = drafteeIds.has(id)}
      {@const action: (value: string) => void = selected ? drafteeIds.delete : drafteeIds.add}
      <li
        data-selected={selected}
        class="bg-muted hover:bg-muted/80 data-[selected=true]:bg-primary/20 cursor-pointer rounded-md transition-colors duration-150"
      >
        <button
          type="button"
          class="flex w-full flex-col gap-3 p-2"
          onclick={action.bind(drafteeIds, id)}
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
  <div class="flex items-center gap-3">
    <Progress value={drafteeIds.size} max={remainingQuota} />
    <span class="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
      {drafteeIds.size} / {remainingQuota} slots
    </span>
  </div>
  <div class="flex items-center gap-2">
    <Button type="submit" class="grow" {disabled}>Submit</Button>
    <Popover.Root>
      <Popover.Trigger>
        <CircleHelpIcon class="text-muted-foreground size-4" />
      </Popover.Trigger>
      <Popover.Content class="text-sm">
        Empty submissions allowed. All lab heads must submit before the next round auto-starts.
        Everyone is notified on round advance.
      </Popover.Content>
    </Popover.Root>
  </div>
</form>
