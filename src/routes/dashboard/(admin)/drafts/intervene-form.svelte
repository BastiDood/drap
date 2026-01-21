<script lang="ts">
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

  import LotteryStudent from './lottery-student.svelte';

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
      if (result.type === 'success') toast.success('Successfully applied the interventions.');
    };
  }}
>
  <ul class="list">
    {#each students as user (user.id)}
      <li class="flex gap-2"><LotteryStudent {labs} {user} /></li>
    {/each}
  </ul>
  <input type="hidden" name="draft" value={draft} />
  <Button
    type="submit"
    variant="outline"
    size="lg"
    class="border-warning bg-warning/10 text-warning hover:bg-warning/20 w-full shadow-lg"
  >
    <ShieldAlert class="size-6" />
    <span>Apply Interventions</span>
  </Button>
</form>
