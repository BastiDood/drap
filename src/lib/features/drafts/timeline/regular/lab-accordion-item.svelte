<script lang="ts">
  import * as Accordion from '$lib/components/ui/accordion';
  import Student from '$lib/users/student.svelte';
  import { Badge } from '$lib/components/ui/badge';

  import type { Lab, Student as StudentType } from '$lib/features/drafts/types';

  interface Props {
    round: number;
    lab: Lab;
    available: StudentType[];
    selected: StudentType[];
  }

  const { round, lab, available, selected }: Props = $props();

  const members = $derived(selected.filter(s => s.labId === lab.id));
  const preferred = $derived(available.filter(s => s.labs[round - 1] === lab.id));
  const interested = $derived(available.filter(s => s.labs.slice(round).includes(lab.id)));
</script>

<Accordion.Item value={lab.id}>
  <Accordion.Trigger>
    <div class="flex w-full justify-between">
      {#if lab.quota === 0}
        <h5 class="text-muted-foreground text-lg font-medium">{lab.name}</h5>
      {:else if members.length < lab.quota}
        <h5 class="text-lg font-medium">{lab.name}</h5>
      {:else}
        <h5 class="text-warning text-lg font-medium">{lab.name}</h5>
      {/if}
      <span class="flex gap-1">
        <Badge variant="outline" class="border-primary bg-primary/10 font-mono text-xs uppercase">
          {members.length} Members
        </Badge>
        <Badge variant="outline" class="border-accent bg-accent/10 font-mono text-xs uppercase">
          {preferred.length} preferred
        </Badge>
        <Badge variant="outline" class="border-warning bg-warning/10 font-mono text-xs uppercase">
          {lab.quota} maximum
        </Badge>
      </span>
    </div>
  </Accordion.Trigger>
  <Accordion.Content>
    <div>
      <hr class="p-2" />
      <div class="grid lg:grid-cols-3">
        <div class="flex flex-col gap-2">
          Members / Already Selected
          {#each members as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="m-2 space-y-4 p-2 italic">No students selected yet.</div>
          {/each}
        </div>
        <div class="flex flex-col gap-2">
          Preferred This Round
          {#each preferred as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="m-2 space-y-4 p-2 italic">No students prefer this lab for this round.</div>
          {/each}
        </div>
        <div class="flex flex-col gap-2">
          Interested in Future Rounds
          {#each interested as { id, ...student } (id)}
            <Student user={student} />
          {:else}
            <div class="m-2 space-y-4 p-2 italic">
              No remaining students are interested in this lab.
            </div>
          {/each}
        </div>
      </div>
    </div>
  </Accordion.Content>
</Accordion.Item>
