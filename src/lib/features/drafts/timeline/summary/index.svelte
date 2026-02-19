<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import StudentCard from '$lib/users/student.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { Draft, DraftConcludedBreakdown, Lab, Student } from '$lib/features/drafts/types';
  import { resolve } from '$app/paths';

  interface Props {
    draftId: bigint;
    draft: Pick<Draft, 'activePeriodStart' | 'activePeriodEnd' | 'maxRounds'>;
    students: Student[];
    labs: Lab[];
    concluded: DraftConcludedBreakdown;
  }

  const { draftId, draft, students, labs, concluded }: Props = $props();

  const totalStudents = $derived(students.length);
  const assignedStudents = $derived(students.filter(s => s.labId !== null).length);
  const participatingLabs = $derived(
    concluded.snapshots.length > 0 ? concluded.snapshots.length : labs.length,
  );
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
      <li><strong>Participating Labs:</strong> {participatingLabs}</li>
      <li>
        <strong>Students Assigned:</strong>
        {assignedStudents} / {totalStudents}
      </li>
    </ul>
  </div>

  <div id="admin-concluded-breakdown" class="grid grid-cols-1 gap-2 md:grid-cols-3">
    <Card.Root class="border-0">
      <Card.Header>
        <Card.Title>Initial Quota</Card.Title>
      </Card.Header>
      <Card.Content>
        <p id="quota-initial" class="text-2xl font-semibold">{concluded.quota.initialQuota}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root class="border-0">
      <Card.Header>
        <Card.Title>Lottery Interventions</Card.Title>
      </Card.Header>
      <Card.Content>
        <p id="quota-interventions" class="text-2xl font-semibold">
          {concluded.quota.lotteryInterventions}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root class="border-0">
      <Card.Header>
        <Card.Title>Concluded Quota</Card.Title>
      </Card.Header>
      <Card.Content>
        <p id="quota-concluded" class="text-2xl font-semibold">{concluded.quota.concludedQuota}</p>
      </Card.Content>
    </Card.Root>
  </div>

  {#if concluded.snapshots.length > 0}
    <Card.Root class="border-0">
      <Card.Header>
        <Card.Title>Lab Quota Timeline</Card.Title>
      </Card.Header>
      <Card.Content>
        <ul class="space-y-1">
          {#each concluded.snapshots as { labId, labName, initialQuota, lotteryQuota, concludedQuota } (labId)}
            <li class="text-sm">
              <strong>{labName}</strong>:
              {initialQuota} initial + {lotteryQuota} lottery = {concludedQuota} concluded
            </li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid grid-cols-1 gap-2">
    <Card.Root id="section-regular-drafted" class="border-0">
      <Card.Header>
        <Card.Title>Regular Drafted ({concluded.sections.regularDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if concluded.sections.regularDrafted.length > 0}
          {#each concluded.sections.regularDrafted as { id, labId, labName, round, ...student } (id)}
            <div class="space-y-1">
              <StudentCard user={{ ...student, labs: [], labId }} />
              <p class="text-muted-foreground px-1 text-sm">
                Assigned to <strong>{labName}</strong> in round {round}.
              </p>
            </div>
          {/each}
        {:else}
          <p class="text-muted-foreground text-sm">No regular-round assignments recorded.</p>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root id="section-intervention-drafted" class="border-0">
      <Card.Header>
        <Card.Title
          >Intervention Drafted ({concluded.sections.interventionDrafted.length})</Card.Title
        >
      </Card.Header>
      <Card.Content class="space-y-2">
        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div id="section-undrafted-after-regular" class="space-y-2">
            <p class="text-sm font-medium">
              Undrafted After Regular ({concluded.sections.undraftedAfterRegular.length})
            </p>
            {#if concluded.sections.undraftedAfterRegular.length > 0}
              {#each concluded.sections.undraftedAfterRegular as { id, ...student } (id)}
                <StudentCard user={{ ...student, labs: [], labId: null }} />
              {/each}
            {:else}
              <p class="text-muted-foreground text-sm">
                All students were drafted during regular rounds.
              </p>
            {/if}
          </div>

          <div id="section-intervention-assignments" class="space-y-2">
            <p class="text-sm font-medium">
              Intervention Assignments ({concluded.sections.interventionDrafted.length})
            </p>
            {#if concluded.sections.interventionDrafted.length > 0}
              {#each concluded.sections.interventionDrafted as { id, labId, labName, assignedAt, ...student } (id)}
                <div class="space-y-1">
                  <StudentCard user={{ ...student, labs: [], labId }} />
                  <p class="text-muted-foreground px-1 text-sm">
                    Intervention assignment to <strong>{labName}</strong> on
                    {#if assignedAt !== null}
                      <time id="intervention-date-{id}" datetime={assignedAt.toISOString()}>
                        {format(assignedAt, 'PPP p')}
                      </time>
                    {:else}
                      <span id="intervention-date-{id}">Unknown date</span>
                    {/if}
                    .
                  </p>
                </div>
              {/each}
            {:else}
              <p class="text-muted-foreground text-sm">No intervention assignments were made.</p>
            {/if}
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root id="section-lottery-drafted" class="border-0">
      <Card.Header>
        <Card.Title>Lottery Drafted ({concluded.sections.lotteryDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if concluded.sections.lotteryDrafted.length > 0}
          {#each concluded.sections.lotteryDrafted as { id, labId, labName, ...student } (id)}
            <div class="space-y-1">
              <StudentCard user={{ ...student, labs: [], labId }} />
              <p class="text-muted-foreground px-1 text-sm">
                Assigned by finalized lottery results to <strong>{labName}</strong>.
              </p>
            </div>
          {/each}
        {:else}
          <p class="text-muted-foreground text-sm">No lottery assignments were recorded.</p>
        {/if}
      </Card.Content>
    </Card.Root>
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
