<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import StudentCard from '$lib/users/student.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { Draft, DraftFinalizedBreakdown, Lab, Student } from '$lib/features/drafts/types';
  import { resolve } from '$app/paths';

  interface Props {
    draftId: bigint;
    draft: Pick<Draft, 'activePeriodStart' | 'activePeriodEnd' | 'maxRounds'>;
    students: Student[];
    labs: Lab[];
    finalized: DraftFinalizedBreakdown;
  }

  const { draftId, draft, students, labs, finalized }: Props = $props();

  const totalStudents = $derived(students.length);
  const assignedStudents = $derived(students.filter(s => s.labId !== null).length);
  const participatingLabs = $derived(
    finalized.snapshots.length > 0 ? finalized.snapshots.length : labs.length,
  );
</script>

<div class="space-y-4">
  <Alert.Root variant="default" class="border-success bg-success/10">
    <CheckCircle2Icon class="text-success" />
    <Alert.Title>Draft Finalized</Alert.Title>
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

  <div id="admin-finalized-breakdown" class="grid grid-cols-1 gap-2 md:grid-cols-3">
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Initial Quota</Card.Title>
      </Card.Header>
      <Card.Content>
        <p id="quota-initial" class="text-2xl font-semibold">{finalized.quota.initialQuota}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Lottery Interventions</Card.Title>
      </Card.Header>
      <Card.Content>
        <p id="quota-interventions" class="text-2xl font-semibold">
          {finalized.quota.lotteryInterventions}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Finalized Quota</Card.Title>
      </Card.Header>
      <Card.Content>
        <p id="quota-finalized" class="text-2xl font-semibold">{finalized.quota.finalizedQuota}</p>
      </Card.Content>
    </Card.Root>
  </div>

  {#if finalized.snapshots.length > 0}
    <Card.Root variant="soft">
      <Card.Header>
        <Card.Title>Lab Quota Timeline</Card.Title>
      </Card.Header>
      <Card.Content>
        <ul class="space-y-1">
          {#each finalized.snapshots as { labId, labName, initialQuota, lotteryQuota, finalizedQuota } (labId)}
            <li class="text-sm">
              <strong>{labName}</strong>:
              {initialQuota} initial + {lotteryQuota} lottery = {finalizedQuota} finalized
            </li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid grid-cols-1 gap-2">
    <Card.Root id="section-regular-drafted" variant="soft">
      <Card.Header>
        <Card.Title>Regular Drafted ({finalized.sections.regularDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if finalized.sections.regularDrafted.length > 0}
          {#each finalized.sections.regularDrafted as { id, labId, labName, round, ...student } (id)}
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

    <Card.Root id="section-intervention-drafted" variant="soft">
      <Card.Header>
        <Card.Title
          >Intervention Drafted ({finalized.sections.interventionDrafted.length})</Card.Title
        >
      </Card.Header>
      <Card.Content class="space-y-2">
        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div id="section-undrafted-after-regular" class="space-y-2">
            <p class="text-sm font-medium">
              Undrafted After Regular ({finalized.sections.undraftedAfterRegular.length})
            </p>
            {#if finalized.sections.undraftedAfterRegular.length > 0}
              {#each finalized.sections.undraftedAfterRegular as { id, ...student } (id)}
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
              Intervention Assignments ({finalized.sections.interventionDrafted.length})
            </p>
            {#if finalized.sections.interventionDrafted.length > 0}
              {#each finalized.sections.interventionDrafted as { id, labId, labName, assignedAt, ...student } (id)}
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

    <Card.Root id="section-lottery-drafted" variant="soft">
      <Card.Header>
        <Card.Title>Lottery Drafted ({finalized.sections.lotteryDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if finalized.sections.lotteryDrafted.length > 0}
          {#each finalized.sections.lotteryDrafted as { id, labId, labName, ...student } (id)}
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
