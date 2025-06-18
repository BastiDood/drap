<script lang="ts">
  import Member from './Member.svelte';

  const { data } = $props();
  const { lab, heads, members } = $derived(data);
</script>

<h2 class="h2">{lab}</h2>
<div class="grid md:grid-cols-2 gap-4">
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
      {#each members as user (user.email)}
        <li
          class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 rounded-md p-2 transition-colors duration-150"
        >
          <Member {user} />
        </li>
      {/each}
    </ul>
  </nav>
</div>
