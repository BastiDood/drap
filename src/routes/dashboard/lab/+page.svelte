<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { groupby } from 'itertools';

  import Member from './Member.svelte';
  import { format } from 'date-fns/format';
  
  const { data } = $props();
  const { lab, heads, members, drafts } = $derived(data);

  const membersByDraft = $derived(
    Array.from(
      groupby(members, ({ draftId }) => Number(draftId)),
      ([draftId, members]) => {
        const memberUsers = [...members].map(
          ({ email, givenName, familyName, studentNumber, avatarUrl }) => {
            return {
              email: email ?? '',
              givenName: givenName ?? 'Unknown User',
              familyName: familyName ?? '???',
              studentNumber: studentNumber ?? '',
              avatarUrl: avatarUrl ?? '',
            };
          },
        );
        return { draftId, memberUsers };
      },
    ),
  );

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
    <div class="space-y-1">
      <Accordion multiple collapsible>
        {#each membersByDraft as { draftId, memberUsers } (draftId)}
        {@const draft = drafts.find(draft => Number(draft.id) === draftId)}
        {#if typeof draft !== 'undefined'}
          {@const start = format(draft.activePeriodStart, 'PPPpp')}
          {@const end = format(draft.activePeriodEnd, 'PPPpp')}
          <Accordion.Item value="draft-{draftId}">
            {#snippet control()}
            <div class="flex flex-col">
              <span class="h4">Draft {draftId}</span>
              <small>
                {#if draft.activePeriodEnd !== null}
                  <time datetime={draft.activePeriodStart.toISOString()}>{start}</time> 
                  to 
                  <time datetime={draft.activePeriodEnd.toISOString()}>{end}</time>
                {:else}
                  Ongoing since <time datetime={draft.activePeriodStart.toISOString()}>{start}</time>
                {/if}
              </small>
            </div>
            {/snippet}
            {#snippet panel()}
            <ul class="space-y-1">
              {#each memberUsers as user (user.email)}
                <li
                  class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 rounded-md p-2 transition-colors duration-150"
                >
                        <Member {user} />
                </li>
                    {/each}
            </ul>
                {/snippet}
              </Accordion.Item>
        {/if}
        {/each}
      </Accordion>
    </div>
  </nav>
</div>
