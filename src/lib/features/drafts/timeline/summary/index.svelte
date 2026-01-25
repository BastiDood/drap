<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import type { Draft, Lab, Student } from '$lib/features/drafts/types';
  import { resolve } from '$app/paths';

  interface Props {
    draftId: bigint;
    draft: Pick<Draft, 'activePeriodStart' | 'activePeriodEnd' | 'maxRounds'>;
    students: Student[];
    labs: Lab[];
  }

  const { draftId, draft, students, labs }: Props = $props();

  const totalStudents = $derived(students.length);
  const assignedStudents = $derived(students.filter(s => s.labId !== null).length);
</script>

<div class="space-y-4">
  <Alert.Root variant="default" class="border-success bg-success/10">
    <CheckCircle2Icon class="text-success" />
    <Alert.Title>Draft Concluded</Alert.Title>
    <Alert.Description>
      This draft has been completed. All students have been assigned to their respective labs.
    </Alert.Description>
  </Alert.Root>

  <div class="prose dark:prose-invert">
    <h3>Summary</h3>
    <ul>
      <li>
        <strong>Duration:</strong>
        {format(draft.activePeriodStart, 'PPP')} - {draft.activePeriodEnd
          ? format(draft.activePeriodEnd, 'PPP')
          : 'Ongoing'}
      </li>
      <li><strong>Total Rounds:</strong> {draft.maxRounds}</li>
      <li><strong>Participating Labs:</strong> {labs.length}</li>
      <li>
        <strong>Students Assigned:</strong>
        {assignedStudents} / {totalStudents}
      </li>
    </ul>
  </div>

  <div class="flex flex-row gap-2">
    <Button href={resolve(`/dashboard/drafts/${draftId}/students.csv`)} download variant="outline">
      <ArrowUpFromLineIcon class="size-5" />
      <span>Export Student Ranks</span>
    </Button>
    <Button href={resolve(`/dashboard/drafts/${draftId}/results.csv`)} download variant="outline">
      <ArrowUpFromLineIcon class="size-5" />
      <span>Export Final Results</span>
    </Button>
  </div>
</div>
