<script lang="ts">
  import { Avatar, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

  type Student = Pick<
    schema.User,
    'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  >;

  interface Props {
    disabled: boolean;
    draft: schema.Draft['id'];
    students: Student[];
    drafteeEmails: schema.User['email'][];
  }

  // eslint-disable-next-line prefer-const
  let { disabled, draft, students, drafteeEmails = $bindable() }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/students/?/rankings"
  class="flex min-w-max flex-col gap-1"
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
>
  <input type="hidden" name="draft" value={draft} />
  <button type="submit" class="variant-filled-primary btn w-full">Submit</button>
  <ListBox multiple rounded="rounded" {disabled}>
    {#each students as { email, givenName, familyName, avatarUrl, studentNumber } (email)}
      <ListBoxItem bind:group={drafteeEmails} name="students" value={email}>
        {#snippet lead()}
          <Avatar src={avatarUrl} />
        {/snippet}
        <div class="flex flex-col">
          <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
          {#if studentNumber !== null}
            <span class="text-sm opacity-50">{studentNumber}</span>
          {/if}
          <span class="text-xs opacity-50">{email}</span>
        </div>
      </ListBoxItem>
    {/each}
  </ListBox>
</form>
