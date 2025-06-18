<script lang="ts">
  import { run } from 'svelte/legacy';

  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import type { ComponentProps } from 'svelte';
  import Student from '$lib/users/Student.svelte';
  import type { schema } from '$lib/server/database';

  type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota'>;
  type StudentProps = ComponentProps<typeof Student>['user'];
  interface StudentUser extends StudentProps {
    id: schema.User['id'];
  }

  interface Props {
    round: number;
    lab: Lab;
    available: StudentUser[];
    selected: StudentUser[];
  }

  // eslint-disable-next-line prefer-const
  let { round, lab, available, selected = $bindable() }: Props = $props();

  run(() => {
    // TODO: Migrate away from this weird pattern of filtering.
    selected = selected.filter(val => val.labId === lab.id);
  });
  const preferred = $derived(available.filter(val => val.labs[round - 1] === lab.id));
  const interested = $derived(available.filter(val => val.labs.slice(round).includes(lab.id)));
</script>

<Accordion.Item value={lab.id}>
  {#snippet control()}
    <div class="flex justify-between">
      {#if lab.quota === 0}
        <h5 class="h5 text-gray-400">{lab.name}</h5>
      {:else if selected.length < lab.quota}
        <h5 class="h5">{lab.name}</h5>
      {:else}
        <h5 class="h5 text-warning-500">{lab.name}</h5>
      {/if}
      <span>
        <span
          class="preset-tonal-primary border-primary-500 badge border font-mono text-xs uppercase"
          >{selected.length} Members</span
        >
        <span
          class="preset-tonal-tertiary border-tertiary-500 badge border font-mono text-xs uppercase"
          >{preferred.length} preferred</span
        >
        <span
          class="preset-tonal-warning border-warning-500 badge border font-mono text-xs uppercase"
          >{lab.quota} maximum</span
        >
      </span>
    </div>
  {/snippet}
  {#snippet panel()}
    <div>
      <hr class="p-2" />
      <div class="grid lg:grid-cols-3">
        <div>
          Members / Already Selected
          {#each selected as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="space-y-4 m-2 p-2 italic">No students selected yet.</div>
          {/each}
        </div>
        <div>
          Preferred This Round
          {#each preferred as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="space-y-4 m-2 p-2 italic">No students prefer this lab for this round.</div>
          {/each}
        </div>
        <div>
          Interested in Future Rounds
          {#each interested as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="space-y-4 m-2 p-2 italic">
              No remaining students are interested in this lab.
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/snippet}
</Accordion.Item>
