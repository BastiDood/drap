<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

  type Student = Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  > & { remark: string };

  interface Props {
    disabled: boolean;
    draft: schema.Draft['id'];
    students: Student[];
    drafteeIds: SvelteSet<schema.User['id']>;
  }

  // eslint-disable-next-line prefer-const
  let { disabled, draft, students, drafteeIds = $bindable() }: Props = $props();
</script>

<form
  inert={disabled}
  method="post"
  action="/dashboard/students/?/rankings"
  use:enhance={({ formData, submitter, cancel }) => {
    const count = formData.getAll('students').length;
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
  <button type="submit" class="preset-filled-primary-500 btn w-full">Submit</button>
  <ul class="space-y-1">
    {#each students as { id, email, givenName, familyName, avatarUrl, studentNumber, remark } (id)}
      {@const selected = drafteeIds.has(id)}
      {@const action: (value: string) => void = selected ? drafteeIds.delete : drafteeIds.add}
      <li
        data-selected={selected}
        class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 data-[selected=true]:preset-filled-surface-500 cursor-pointer rounded-md transition-colors duration-150"
      >
        <button
          type="button"
          class="flex flex-col w-full gap-3 p-2"
          onclick={action.bind(drafteeIds, id)}
        >
          <div class="flex items-center gap-3 p-2">
            <Avatar src={avatarUrl} name="{givenName} {familyName}" />
            <div class="flex flex-col">
              <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
              {#if studentNumber !== null}
                <span class="text-start text-sm opacity-50">{studentNumber}</span>
              {/if}
              <span class="text-start text-xs opacity-50">{email}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-start"><strong>Remarks</strong></span>
            <p class="text-start text-sm opacity-50 max-h-24 overflow-y-scroll">
              {remark}
            </p>
          </div>
        </button>
      </li>
    {/each}
  </ul>
</form>
