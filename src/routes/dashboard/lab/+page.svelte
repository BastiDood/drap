<script lang="ts">
  import { groupby } from 'itertools';
  import Member from './Member.svelte';

  const { data } = $props();
  const { lab, heads, members } = $derived(data);

  const membersByDraft = $derived(Array.from(
    groupby(members, ({ draftId }) => Number(draftId)),
    ([ draftId, members ]) => {
      let memberUsers = [...members].map(({ email, givenName, familyName, studentNumber, avatarUrl }) => {
        return {
          email: email ?? '',
          givenName: givenName ?? 'Unknown User',
          familyName: familyName ?? '???',
          studentNumber: studentNumber ?? '',
          avatarUrl: avatarUrl ?? '',
        }
      });
      return { draftId, memberUsers };
    }
  ))
</script>

<h2 class="h2">{lab}</h2>
<div class="grid gap-4 md:grid-cols-2">
  <nav class="list-nav space-y-2">
    <h3 class="h3">Heads</h3>
    <ul class="space-y-1">
      {#each heads as user (user.email)}
        <li
          class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 rounded-md p-2 transition-colors duration-150"
        >
          <Member {user} />
        </li>
      {/each}
    </ul>
  </nav>
  <nav class="list-nav space-y-2">
    <h3 class="h3">Members</h3>
    <ul class="space-y-1">
      {#each membersByDraft as {draftId, memberUsers}}
        <h4 class="h4">Draft {draftId}</h4>
        {#each memberUsers as user (user.email)}
          <li
            class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 rounded-md p-2 transition-colors duration-150"
          >
            <Member {user} />
          </li>
        {/each}
      {/each}
    </ul>
  </nav>
</div>
