<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import Student from '$lib/users/student.svelte';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';

  import ConcludeForm from './conclude-form.svelte';
  import Dashboard from './dashboard.svelte';
  import InitForm from './init-form.svelte';
  import InterveneForm from './intervene-form.svelte';
  import StartForm from './start-form.svelte';

  const { data } = $props();
  const { draft, labs, records, available, selected } = $derived(data);
</script>

{#if draft !== null}
  <div class="flex flex-row gap-2">
    <Button href={resolve(`/dashboard/drafts/${draft.id}/students.csv`)} download>
      <ArrowUpFromLineIcon class="size-5" />
      <span>Export Student Ranks</span>
    </Button>
    <Button href={resolve(`/dashboard/drafts/${draft.id}/results.csv`)} download>
      <ArrowUpFromLineIcon class="size-5" />
      <span>Export Ongoing Draft Results</span>
    </Button>
  </div>
{/if}

{#if draft === null}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
    <div class="prose dark:prose-invert">
      <h2>Start a New Draft</h2>
      <p>
        Welcome to the <strong>Draft Ranking Automated Processor</strong>! There are currently no
        drafts happening at the moment, but as an administrator, you have the authorization to start
        a new one.
      </p>
      <p>
        To begin, simply provide the the maximum number of rounds for the upcoming draft. This has
        historically been set to <strong>5</strong>.
      </p>
      <Alert.Root variant="warning">
        <TriangleAlertIcon />
        <Alert.Description>
          Please be aware that once the draft starts and students are allowed to register,
          <strong>no labs can be deleted or restored</strong>. Further, once student registration is
          closed and control handed off to lab heads,
          <strong>lab quotas can no longer be adjusted.</strong>
        </Alert.Description>
      </Alert.Root>
    </div>
    <InitForm />
  </div>
{:else if draft.currRound === null}
  <div class="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
    <div class="prose dark:prose-invert">
      <h3>Lottery</h3>
      <p>
        Draft #{draft.id} is almost done! The final stage is the lottery phase, where the remaining undrafted
        students are randomly assigned to their labs. Before the system automatically randomizes anything,
        administrators are given a final chance to manually intervene with the draft results.
      </p>
      <ul>
        <li>
          The <strong>"Eligible for Lottery"</strong> section features a list of the remaining undrafted
          students. Administrators may negotiate with the lab heads on how to manually assign and distribute
          these students fairly among interested labs.
        </li>
        <li>
          Meanwhile, the <strong>"Already Drafted"</strong> section features an <em>immutable</em> list
          of students who have already been drafted into their respective labs. These are considered final.
        </li>
      </ul>
      <p>
        <!-- TODO: Add reminder about resetting the lab quota. -->
        When ready, administrators can press the <strong>"Conclude Draft"</strong> button to proceed with
        the randomization stage. The list of students will be randomly shuffled and distributed among
        the labs in a round-robin fashion. To uphold fairness, it is important that uneven distributions
        are manually resolved beforehand.
      </p>
      <p>
        After the randomization stage, the draft process is officially complete. All students, lab
        heads, and administrators are notified of the final results.
      </p>
      <ConcludeForm draft={draft.id} />
    </div>
    <div class="min-w-max space-y-2">
      <Card.Root class="border-warning bg-warning/10">
        <Card.Header>
          <Card.Title>Eligible for Lottery ({available.length})</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          {#if available.length > 0}
            <InterveneForm draft={draft.id} {labs} students={available} />
          {:else}
            <p class="prose dark:prose-invert max-w-none">
              Congratulations! All participants have been drafted. No action is needed here.
            </p>
          {/if}
        </Card.Content>
      </Card.Root>
      <Card.Root class="border-success bg-success/10">
        <Card.Header>
          <Card.Title>Already Drafted ({selected.length})</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="space-y-1">
            {#each selected as { id, ...user } (id)}
              <li class="bg-muted hover:bg-muted/80 rounded-md p-2 transition-colors duration-150">
                <Student {user} />
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
{:else if draft.currRound > 0}
  <Dashboard {labs} {records} {available} {selected} round={draft.currRound} />
{:else if available.length > 0}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
    <div class="space-y-4">
      <section class="prose dark:prose-invert">
        <h2>Registered Students</h2>
        <p>
          There are currently <strong>{available.length}</strong> students who have registered for
          this draft. Press the <strong>"Start Draft"</strong> button to close registration and start
          the draft automation.
        </p>
        <p>
          Lab heads will be notified when the first round begins. The draft proceeds to the next
          round when all lab heads have submitted their preferences. This process repeats until the
          configured maximum number of rounds has elapsed, after which the draft pauses until an
          administrator
          <em>manually</em> proceeds with the lottery stage.
        </p>
      </section>
      <StartForm draft={draft.id} />
    </div>
    <nav class="w-full">
      <ul class="space-y-1">
        {#each available as { id, ...user } (id)}
          <li><Student {user} /></li>
        {/each}
      </ul>
    </nav>
  </div>
{:else}
  <Alert.Root variant="warning">
    <TriangleAlertIcon />
    <Alert.Description>
      No students have registered for this draft yet. The draft cannot proceed until at least one
      student participates.
    </Alert.Description>
  </Alert.Root>
{/if}
