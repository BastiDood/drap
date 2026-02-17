<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  interface AssignmentRow {
    id: string;
    labId: string;
    studentEmail: string;
  }

  interface Props {
    name?: string;
  }

  const { name = 'lotteryAssignments' }: Props = $props();
  const rows = $state<AssignmentRow[]>([]);

  function addRow() {
    rows.push({ id: crypto.randomUUID(), labId: '', studentEmail: '' });
  }

  function removeRow(index: number) {
    const [row, ...rest] = rows.splice(index, 1);
    assert(rest.length === 0);
    return row;
  }
</script>

<div class="space-y-2">
  <Label>Lottery Assignments</Label>
  <div class="space-y-2">
    {#each rows as row, index (row.id)}
      <div class="flex items-end gap-2">
        <Input
          type="text"
          name="{name}.{index}.labId"
          bind:value={row.labId}
          placeholder="ndsl"
          required
        />
        <Input
          type="email"
          name="{name}.{index}.studentEmail"
          bind:value={row.studentEmail}
          placeholder="student@up.edu.ph"
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onclick={({ currentTarget }) => {
            const id = currentTarget.dataset.index;
            if (typeof id !== 'undefined') removeRow(Number.parseInt(id, 10));
          }}
          aria-label="Remove Lottery Assignment"
          data-index={index}
        >
          <Trash2Icon class="size-4" />
        </Button>
      </div>
    {/each}
    <Button
      type="button"
      variant="outline"
      class="text-muted-foreground w-full justify-start border-2 border-dashed"
      onclick={addRow}
    >
      <PlusIcon class="size-4" />
      <span>Add Lottery Assignment</span>
    </Button>
  </div>
</div>
