<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { createQuery } from '@tanstack/svelte-query';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import StudentCard from '$lib/users/student.svelte';
  import { Button } from '$lib/components/ui/button';
  import type {
    Draft,
    DraftFinalizedBreakdown,
    Lab,
    SerializableStudent,
    Student,
  } from '$lib/features/drafts/types';
  import { Empty } from '$lib/components/ui/empty';
  import { resolve } from '$app/paths';

  interface Props {
    draftId: bigint;
    draft: Pick<Draft, 'activePeriodStart' | 'activePeriodEnd' | 'maxRounds'>;
    totalStudents: number;
    labs: Lab[];
    finalized: DraftFinalizedBreakdown;
    isReview: boolean;
  }

  const { draftId, draft, totalStudents, labs, finalized, isReview }: Props = $props();

  const assignedStudents = $derived(
    finalized.sections.regularDrafted.length +
      finalized.sections.interventionDrafted.length +
      finalized.sections.lotteryDrafted.length,
  ); // Get from snapshots
  const participatingLabs = $derived(
    finalized.snapshots.length > 0 ? finalized.snapshots.length : labs.length,
  );

  const regularDraftedIds = $derived(
    new Set(finalized.sections.regularDrafted.map(({ id }) => id)),
  );

  // Only loads when this component mounts
  const {
    isPending,
    isError,
    data: undraftedAfterRegular,
  } = $derived(
    createQuery(() => ({
      queryKey: ['undrafted-after-regular'],
      async queryFn() {
        const response = await fetch(`/dashboard/drafts/${draftId}/draftees`);
        const serializedData = (await response.json()) as SerializableStudent[];
        if (typeof serializedData === 'undefined') return [];

        const data = serializedData.map(draftee => {
          return {
            ...draftee,

            // Revert non-serializable attributes to original data types
            studentNumber: draftee.studentNumber === null ? null : BigInt(draftee.studentNumber),
          };
        }) as Student[];

        // Return undrafted after regular
        return data.filter(({ id }) => !regularDraftedIds.has(id));
      },
    })),
  );
</script>

{#if isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else}
  <div class="space-y-4">
    {#if isReview}
      <Alert.Root variant="warning">
        <SparklesIcon class="text-accent" />
        <Alert.Title>Draft Review</Alert.Title>
        <Alert.Description>
          Lottery assignments are complete. Review results below before finalizing.
        </Alert.Description>
      </Alert.Root>
    {:else}
      <Alert.Root variant="success">
        <CheckCircle2Icon class="text-success" />
        <Alert.Title>Draft Finalized</Alert.Title>
        <Alert.Description>
          This draft has been completed. All students have been assigned to their respective labs.
        </Alert.Description>
      </Alert.Root>
    {/if}

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
          <p id="quota-finalized" class="text-2xl font-semibold">
            {finalized.quota.finalizedQuota}
          </p>
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
                Undrafted After Regular ({undraftedAfterRegular.length})
              </p>
              {#if undraftedAfterRegular.length > 0}
                {#each undraftedAfterRegular as { id, ...student } (id)}
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
      <Button
        href={resolve(`/dashboard/drafts/${draftId}/students.csv`)}
        download
        variant="outline"
      >
        <ArrowUpFromLineIcon class="size-5" />
        <span>Export Student Ranks</span>
      </Button>
      <Button href={resolve(`/dashboard/drafts/${draftId}/results.csv`)} download variant="outline">
        <ArrowUpFromLineIcon class="size-5" />
        <span>Export Final Results</span>
      </Button>
    </div>
  </div>
{/if}
