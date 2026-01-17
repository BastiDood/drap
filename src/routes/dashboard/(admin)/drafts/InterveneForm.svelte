<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ShieldExclamation } from '@steeze-ui/heroicons';

  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  import LotteryStudent from './LotteryStudent.svelte';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;
  type User = Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  >;

  interface Props {
    draft: schema.Draft['id'];
    labs: Lab[];
    students: User[];
  }

  const { draft, labs, students }: Props = $props();

  const toaster = useToaster();
</script>

<form
  method="post"
  action="/dashboard/drafts/?/intervene"
  class="space-y-4"
  use:enhance={({ submitter, cancel }) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to apply these interventions?')) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      if (result.type === 'success')
        toaster.success({ title: 'Successfully applied the interventions.' });
    };
  }}
>
  <ul class="list">
    {#each students as user (user.id)}
      <li class="flex gap-2"><LotteryStudent {labs} {user} /></li>
    {/each}
  </ul>
  <input type="hidden" name="draft" value={draft} />
  <button
    type="submit"
    class="!preset-tonal-warning preset-outlined-warning-300-700 btn btn-lg w-full border-1 shadow-lg"
  >
    <Icon src={ShieldExclamation} class="size-8" />
    <span>Apply Interventions</span>
  </button>
</form>
