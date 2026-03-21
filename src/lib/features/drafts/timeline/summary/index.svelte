<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import StudentCard from '$lib/users/student.svelte';
  import { Button } from '$lib/components/ui/button';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import type { Draft, DraftFinalizedBreakdown, Lab } from '$lib/features/drafts/types';
  import { Empty } from '$lib/components/ui/empty';
  import { resolve } from '$app/paths';

  import DraftRoundsChart from './draft-rounds-chart.svelte';

  interface Props {
    draftId: string;
    draft: Pick<Draft, 'activePeriodStart' | 'activePeriodEnd' | 'maxRounds'>;
    totalStudents: number;
    labs: Lab[];
    finalized: DraftFinalizedBreakdown;
    isReview: boolean;
  }

  const { draftId, draft, totalStudents, labs, finalized, isReview }: Props = $props();
  const participatingLabs = $derived(
    finalized.snapshots.length > 0 ? finalized.snapshots.length : labs.length,
  );

  const regularDraftedIds = $derived(
    new Set(finalized.sections.regularDrafted.map(({ id }) => id)),
  );

  const query = $derived(createFetchDrafteesQuery(draftId));
</script>

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

  <!-- Draft Summary Stats -->
  <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-md font-semibold tabular-nums">Total students</Card.Title>
        <Card.Title id="stat-total-students" class="text-4xl font-semibold tabular-nums">
          {totalStudents}
        </Card.Title>
      </Card.Header>
      <Card.Footer class="flex-col items-start gap-1.5 text-sm">
        <div class="flex items-center gap-2 font-medium text-muted-foreground">
          <UsersIcon class="size-4 text-muted-foreground" />
          All registered participants
        </div>
      </Card.Footer>
    </Card.Root>

    <Card.Root class="bg-gradient-to-br from-muted/30 to-muted/10">
      <Card.Header>
        <Card.Title class="text-md font-semibold tabular-nums">Participating Labs</Card.Title>
        <Card.Title id="stat-participating-labs" class="text-4xl font-semibold tabular-nums">
          {participatingLabs}
        </Card.Title>
      </Card.Header>
      <Card.Footer class="flex-col items-start gap-1.5 text-sm">
        <div class="text-muted-foreground">Active labs in draft</div>
      </Card.Footer>
    </Card.Root>

    <Card.Root class="bg-gradient-to-br from-muted/30 to-muted/10">
      <Card.Header>
        <Card.Title class="text-md font-semibold tabular-nums">Max Rounds</Card.Title>
        <Card.Title id="stat-max-rounds" class="text-4xl font-semibold tabular-nums">
          {draft.maxRounds}
        </Card.Title>
      </Card.Header>
      <Card.Footer class="flex-col items-start gap-1.5 text-sm">
        <div class="text-muted-foreground">Regular draft rounds</div>
      </Card.Footer>
    </Card.Root>
    <Card.Root class="bg-gradient-to-br from-muted/30 to-muted/10">
      <Card.Header>
        <Card.Title class="text-md font-semibold tabular-nums">Interventions</Card.Title>
        <Card.Title id="quota-interventions" class="text-4xl font-semibold tabular-nums">
          {finalized.quota.lotteryInterventions}
        </Card.Title>
      </Card.Header>
      <Card.Footer class="flex-col items-start gap-1.5 text-sm">
        <div class="text-muted-foreground">Interventions Made</div>
      </Card.Footer>
    </Card.Root>
    <Card.Root class="bg-gradient-to-br from-muted/30 to-muted/10">
      <Card.Header>
        <Card.Title class="text-md font-semibold tabular-nums">Lottery Assignments</Card.Title>
        <Card.Title id="quota-interventions" class="text-4xl font-semibold tabular-nums">
          {finalized.sections.lotteryDrafted.length}
        </Card.Title>
      </Card.Header>
      <Card.Footer class="flex-col items-start gap-1.5 text-sm">
        <div class="text-muted-foreground">Students chosen during lottery</div>
      </Card.Footer>
    </Card.Root>
  </div>

  <DraftRoundsChart
    records={finalized.sections.regularDrafted}
    maxRounds={draft.maxRounds}
    interventionRecords={finalized.sections.interventionDrafted}
    lotteryRecords={finalized.sections.lotteryDrafted}
    {labs}
    {totalStudents}
  />

  <div class="grid grid-cols-1 gap-2">
    <Card.Root
      id="section-regular-drafted"
      variant="soft"
      class="bg-gradient-to-br from-muted/30 to-muted/10"
    >
      <Card.Header>
        <Card.Title>Regular Drafted ({finalized.sections.regularDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if finalized.sections.regularDrafted.length > 0}
          {#each finalized.sections.regularDrafted as { id, labId, labName, round, ...student } (id)}
            <div class="space-y-1">
              <StudentCard user={{ ...student, labs: [], labId }} />
              <p class="px-1 text-sm text-muted-foreground">
                Assigned to <strong>{labName}</strong> in round {round}.
              </p>
            </div>
          {/each}
        {:else}
          <p class="text-sm text-muted-foreground">No regular-round assignments recorded.</p>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root
      id="section-intervention-drafted"
      variant="soft"
      class="bg-gradient-to-br from-muted/30 to-muted/10"
    >
      <Card.Header>
        <Card.Title
          >Intervention Drafted ({finalized.sections.interventionDrafted.length})</Card.Title
        >
      </Card.Header>
      <Card.Content class="space-y-2">
        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {#if query.isPending}
            <div class="flex h-full items-center justify-center">
              <Loader2Icon class="size-20 animate-spin" />
            </div>
          {:else if query.isError}
            <Empty>Uh oh! An error has occurred.</Empty>
          {:else}
            {@const undraftedAfterRegular = query.data.filter(
              ({ id }) => !regularDraftedIds.has(id),
            )}
            <div id="section-undrafted-after-regular" class="space-y-2">
              <p class="text-sm font-medium">
                Undrafted After Regular ({undraftedAfterRegular.length})
              </p>
              {#if undraftedAfterRegular.length > 0}
                {#each undraftedAfterRegular as { id, ...student } (id)}
                  <StudentCard user={{ ...student, labs: [], labId: null }} />
                {/each}
              {:else}
                <p class="text-sm text-muted-foreground">
                  All students were drafted during regular rounds.
                </p>
              {/if}
            </div>
          {/if}

          <div id="section-intervention-assignments" class="space-y-2">
            <p class="text-sm font-medium">
              Intervention Assignments ({finalized.sections.interventionDrafted.length})
            </p>
            {#if finalized.sections.interventionDrafted.length > 0}
              {#each finalized.sections.interventionDrafted as { id, labId, labName, assignedAt, ...student } (id)}
                <div class="space-y-1">
                  <StudentCard user={{ ...student, labs: [], labId }} />
                  <p class="px-1 text-sm text-muted-foreground">
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
              <p class="text-sm text-muted-foreground">No intervention assignments were made.</p>
            {/if}
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root
      id="section-lottery-drafted"
      variant="soft"
      class="bg-gradient-to-br from-muted/30 to-muted/10"
    >
      <Card.Header>
        <Card.Title>Lottery Drafted ({finalized.sections.lotteryDrafted.length})</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if finalized.sections.lotteryDrafted.length > 0}
          {#each finalized.sections.lotteryDrafted as { id, labId, labName, ...student } (id)}
            <div class="space-y-1">
              <StudentCard user={{ ...student, labs: [], labId }} />
              <p class="px-1 text-sm text-muted-foreground">
                Assigned by finalized lottery results to <strong>{labName}</strong>.
              </p>
            </div>
          {/each}
        {:else}
          <p class="text-sm text-muted-foreground">No lottery assignments were recorded.</p>
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
