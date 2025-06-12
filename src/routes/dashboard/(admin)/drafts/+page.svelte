<script lang="ts">
  import Dashboard from './Dashboard.svelte';
  import Student from '$lib/users/Student.svelte';
  import WarningAlert from '$lib/alerts/Warning.svelte';

  import ConcludeForm from './ConcludeForm.svelte';
  import InitForm from './InitForm.svelte';
  import InterveneForm from './InterveneForm.svelte';
  import StartForm from './StartForm.svelte';

  const { data } = $props();
  const { draft, labs, records, available, selected } = $derived(data);
</script>

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
          of students who have already been drafted into their respective labs. These are considered
          final.
        </li>
      </ul>
      <p>
        <!-- TODO: Add reminder about resetting the lab quota. -->
        When ready, administrators can press the <strong>"Conclude Draft"</strong> button to proceed
        with the randomization stage. The list of students will be randomly shuffled and distributed
        among the labs in a round-robin fashion. To uphold fairness, it is important that uneven distributions
        are manually resolved beforehand.
      </p>
      <p>
        After the randomization stage, the draft process is officially complete. All students, lab
        heads, and administrators are notified of the final results.
      </p>
      <ConcludeForm draft={draft.id} />
    </div>
    <div class="min-w-max space-y-2">
      <nav class="card preset-tonal-warning border-warning-500 space-y-4 border p-4">
        <h3 class="h3">Eligible for Lottery ({available.length})</h3>
        {#if available.length > 0}
          <InterveneForm draft={draft.id} {labs} students={available} />
        {:else}
          <p class="prose dark:prose-invert max-w-none">
            Congratulations! All participants have been drafted. No action is needed here.
          </p>
        {/if}
      </nav>
      <nav class="card preset-tonal-success border-success-500 space-y-4 border p-4">
        <h3 class="h3">Already Drafted ({selected.length})</h3>
        <ul class="space-y-1">
          {#each selected as { id, ...user } (id)}
            <li
              class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 rounded-md p-2 transition-colors duration-150"
            >
              <Student {user} />
            </li>
          {/each}
        </ul>
      </nav>
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
    <nav class="list-nav w-full">
      <ul class="list">
        {#each available as { id, ...user } (id)}
          <li><Student {user} /></li>
        {/each}
      </ul>
    </nav>
  </div>
{:else}
  <WarningAlert
    >No students have registered for this draft yet. The draft cannot proceed until at least one
    student participates.</WarningAlert
  >
{/if}
