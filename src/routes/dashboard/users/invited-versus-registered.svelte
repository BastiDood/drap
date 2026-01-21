<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import Faculty from '$lib/users/faculty.svelte';
  import Invited from '$lib/users/invited.svelte';
  import type { schema } from '$lib/server/database';

  type FacultyPropsUser = ComponentProps<typeof Faculty>['user'];
  interface FacultyUser extends FacultyPropsUser {
    id: schema.User['id'];
  }

  type InvitedPropsUser = ComponentProps<typeof Invited>['user'];
  interface InvitedUser extends InvitedPropsUser {
    id: schema.User['id'];
  }

  interface Props {
    invited: InvitedUser[];
    registered: FacultyUser[];
  }

  const { invited, registered }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  <nav class="space-y-2">
    <h4 class="text-lg font-semibold">Invited</h4>
    <ul class="space-y-1">
      {#each invited as { id, ...head } (id)}
        <li class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150">
          <Invited user={head} />
        </li>
      {/each}
    </ul>
  </nav>
  <nav class="space-y-2">
    <h4 class="text-lg font-semibold">Registered</h4>
    <ul class="space-y-1">
      {#each registered as { id, ...head } (id)}
        <li class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150">
          <Faculty user={head} />
        </li>
      {/each}
    </ul>
  </nav>
</div>
