<script lang="ts" module>
  import type { Lab, Student } from '$lib/features/drafts/types';

  export interface Props {
    round: number;
    labs: Lab[];
    students: Student[];
  }
</script>

<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';

  import UndraftedStudentSection from './student-section.svelte';

  const { round, labs, students }: Props = $props();

  let selectedLabIds = $state<string[]>([]);

  const selectedLabSet = $derived(new Set(selectedLabIds));

  const selectedLabLabel = $derived.by(() => {
    switch (selectedLabIds.length) {
      case 0:
        return 'Select Labs';
      case 1: {
        const [labId] = selectedLabIds;
        if (typeof labId === 'undefined') return 'Select Labs';
        return labId.toUpperCase();
      }
      default:
        return `${selectedLabIds.length} labs selected.`;
    }
  });

  const sortedStudents = $derived.by(() =>
    students.toSorted((left, right) => {
      const familyOrder = left.familyName.localeCompare(right.familyName);
      return familyOrder === 0 ? left.givenName.localeCompare(right.givenName) : familyOrder;
    }),
  );

  const preferredStudents = $derived.by(() => {
    if (selectedLabSet.size === 0) return [];
    return sortedStudents.filter(student => {
      const selectedLab = student.labs[round - 1];
      return typeof selectedLab === 'string' && selectedLabSet.has(selectedLab);
    });
  });

  const interestedStudents = $derived.by(() => {
    if (selectedLabSet.size === 0) return [];
    return sortedStudents.filter(student =>
      student.labs.slice(round).some(labId => selectedLabSet.has(labId)),
    );
  });
</script>

<div class="flex min-h-full flex-col gap-4">
  <div class="shrink-0">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button variant="outline" class="w-full justify-between md:w-auto" {...props}>
            <span>{selectedLabLabel}</span>
            <ChevronDownIcon class="size-4 text-muted-foreground" />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" class="min-w-56">
        <DropdownMenu.Item
          disabled={selectedLabIds.length === 0}
          onclick={() => {
            selectedLabIds = [];
          }}
        >
          Clear Selection
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.CheckboxGroup
          value={selectedLabIds}
          onValueChange={value => {
            selectedLabIds = [...value];
          }}
        >
          {#each labs as lab (lab.id)}
            <DropdownMenu.CheckboxItem value={lab.id} class="uppercase">
              {lab.id}
            </DropdownMenu.CheckboxItem>
          {/each}
        </DropdownMenu.CheckboxGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
  <div class="min-h-0 grow">
    <div class="grid min-h-full gap-4 md:grid-cols-2">
      <UndraftedStudentSection
        title="Preferred"
        description="Selected this round"
        selectedCount={selectedLabIds.length}
        students={preferredStudents}
      />
      <UndraftedStudentSection
        title="Interested"
        description="Selected in future rounds"
        selectedCount={selectedLabIds.length}
        students={interestedStudents}
      />
    </div>
  </div>
</div>
