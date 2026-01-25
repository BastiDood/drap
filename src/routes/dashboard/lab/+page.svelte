<script lang="ts">
  import { format } from 'date-fns/format';
  import { groupby } from 'itertools';

  import * as Accordion from '$lib/components/ui/accordion';

  import Member from './member.svelte';

  const { data } = $props();
  const { lab, heads, members, faculty, drafts } = $derived(data);

  const membersByDraft = $derived(
    Array.from(
      groupby(members, ({ draftId }) => Number(draftId)),
      ([draftId, members]) => ({
        draftId,
        memberUsers: Array.from(members, ({ email, givenName, familyName, avatarUrl }) => ({
          email: email ?? '',
          givenName: givenName ?? '',
          familyName: familyName ?? '',
          avatarUrl: avatarUrl ?? '',
        })),
      }),
    ),
  );
</script>

<h2 class="scroll-m-20 text-3xl font-semibold tracking-tight">{lab}</h2>
<div class="grid gap-4 md:grid-cols-2">
  <nav class="space-y-2">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Heads</h3>
    <ul class="space-y-1">
      {#each heads as user (user.email)}
        <li class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150">
          <Member {user} />
        </li>
      {/each}
    </ul>
    {#if faculty.length > 0}
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Faculty</h3>
      <ul class="space-y-1">
        {#each faculty as user (user.email)}
          <li class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150">
            <Member {user} />
          </li>
        {/each}
      </ul>
    {/if}
  </nav>
  <nav class="space-y-2">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Members</h3>
    <div class="space-y-1">
      <Accordion.Root type="multiple">
        {#each membersByDraft as { draftId, memberUsers } (draftId)}
          {@const draft = drafts.find(draft => Number(draft.id) === draftId)}
          {#if typeof draft !== 'undefined'}
            {@const start = format(draft.activePeriodStart, 'PPPpp')}
            <Accordion.Item value="draft-{draftId}">
              <Accordion.Trigger>
                <div class="flex flex-col items-start text-left">
                  <span class="text-lg font-semibold">Draft {draftId}</span>
                  <small class="text-muted-foreground">
                    {#if draft.activePeriodEnd === null}
                      Ongoing since <time datetime={draft.activePeriodStart.toISOString()}
                        >{start}</time
                      >
                    {:else}
                      {@const end = format(draft.activePeriodEnd, 'PPPpp')}
                      <time datetime={draft.activePeriodStart.toISOString()}>{start}</time>
                      to
                      <time datetime={draft.activePeriodEnd.toISOString()}>{end}</time>
                    {/if}
                  </small>
                </div>
              </Accordion.Trigger>
              <Accordion.Content>
                <ul class="space-y-1">
                  {#each memberUsers as user (user.email)}
                    <li
                      class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150"
                    >
                      <Member {user} />
                    </li>
                  {/each}
                </ul>
              </Accordion.Content>
            </Accordion.Item>
          {/if}
        {/each}
      </Accordion.Root>
    </div>
  </nav>
</div>
