<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { run } from 'svelte/legacy';

  import * as Accordion from '$lib/components/ui/accordion';
  import Student from '$lib/users/student.svelte';
  import { Badge } from '$lib/components/ui/badge';
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

  let { round, lab, available, selected = $bindable() }: Props = $props();

  run(() => {
    // TODO: Migrate away from this weird pattern of filtering.
    selected = selected.filter(val => val.labId === lab.id);
  });
  const preferred = $derived(available.filter(val => val.labs[round - 1] === lab.id));
  const interested = $derived(available.filter(val => val.labs.slice(round).includes(lab.id)));
</script>

<Accordion.Item value={lab.id}>
  <Accordion.Trigger>
    <div class="flex w-full justify-between">
      {#if lab.quota === 0}
        <h5 class="text-muted-foreground text-lg font-medium">{lab.name}</h5>
      {:else if selected.length < lab.quota}
        <h5 class="text-lg font-medium">{lab.name}</h5>
      {:else}
        <h5 class="text-warning text-lg font-medium">{lab.name}</h5>
      {/if}
      <span class="flex gap-1">
        <Badge variant="outline" class="border-primary bg-primary/10 font-mono text-xs uppercase"
          >{selected.length} Members</Badge
        >
        <Badge variant="outline" class="border-accent bg-accent/10 font-mono text-xs uppercase"
          >{preferred.length} preferred</Badge
        >
        <Badge variant="outline" class="border-warning bg-warning/10 font-mono text-xs uppercase"
          >{lab.quota} maximum</Badge
        >
      </span>
    </div>
  </Accordion.Trigger>
  <Accordion.Content>
    <div>
      <hr class="p-2" />
      <div class="grid lg:grid-cols-3">
        <div class="flex flex-col gap-2">
          Members / Already Selected
          {#each selected as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="space-y-4 m-2 p-2 italic">No students selected yet.</div>
          {/each}
        </div>
        <div class="flex flex-col gap-2">
          Preferred This Round
          {#each preferred as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="space-y-4 m-2 p-2 italic">No students prefer this lab for this round.</div>
          {/each}
        </div>
        <div class="flex flex-col gap-2">
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
  </Accordion.Content>
</Accordion.Item>
