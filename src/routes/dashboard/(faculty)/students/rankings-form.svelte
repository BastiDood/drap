<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  import * as Avatar from '$lib/components/ui/avatar';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

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
  }

  let { disabled, draft, students, drafteeIds = $bindable() }: Props = $props();
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
    return async ({ update }) => {
      submitter.disabled = false;
      await update();
    };
  }}
  class="flex flex-col gap-4 inert:opacity-20"
>
  <input type="hidden" name="draft" value={draft} />
  {#each drafteeIds as id (id)}
    <input type="hidden" name="students" value={id} />
  {/each}
  <Button type="submit" class="w-full" {disabled}>Submit</Button>
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
</form>
