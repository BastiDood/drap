<script lang="ts">
  import Member from './Member.svelte';

  const { data } = $props();
  const { lab, heads, members } = $derived(data);
</script>

<h2 class="h2">{lab}</h2>
<div class="grid grid-cols-2 gap-4">
  <nav class="list-nav space-y-2">
    <h3 class="h3">Heads</h3>
    <ul>
      {#each heads as user (user.email)}
        <li><Member {user} /></li>
      {/each}
    </ul>
  </nav>
  <nav class="list-nav space-y-2">
    <h3 class="h3">Members</h3>
    <ul>
      {#each members as user (user.email)}
        <li><Member {user} /></li>
      {/each}
    </ul>
  </nav>
</div>
