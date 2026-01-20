<script lang="ts">
  import { AcademicCap, Beaker, ShieldExclamation } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  import banner from '$lib/banner.png?url';
  import Hero from '$lib/components/hero.svelte';
  import Link from '$lib/components/link.svelte';
  import { asset, resolve } from '$app/paths';

  let activeTab = $state<'student' | 'lab-head' | 'admin'>('student');
</script>

<Hero />
<div class="mb-8 px-10 lg:px-56">
  <section class="prose dark:prose-invert max-w-none">
    <p>
      Welcome to <strong>DRAP</strong>: the <strong>Draft Ranking Automated Processor</strong> for
      the
      <Link href="https://up.edu.ph/" target="_blank">University of the Philippines</Link>
      <Link href="https://upd.edu.ph/" target="_blank">Diliman</Link>
      - <Link href="https://dcs.upd.edu.ph/" target="_blank">Department of Computer Science</Link>'s
      yearly draft of research lab assignments. In a nutshell, this web application automates the
      mechanics of the draft.
    </p>
  </section>

  <section class="prose dark:prose-invert prose-h3:mt-0 prose-h3:mb-2 prose-li:m-0 my-8 max-w-none">
    <h2 class="border-surface-800 border-b pb-2">How It Works</h2>
    <ol class="mx-auto max-w-prose pl-0">
      <li class="grid grid-cols-[auto_1fr] gap-4">
        <div class="flex flex-col items-center">
          <div
            class="bg-primary-500 text-primary-contrast-dark flex size-9 items-center justify-center rounded-full font-bold"
          >
            1
          </div>
          <div aria-hidden="true" class="bg-surface-700 w-1 flex-1"></div>
        </div>
        <div class="pb-8">
          <h3 class="text-xl font-bold">Registration</h3>
          <p>
            All participating students register for the draft by providing their full name, email,
            student number, and lab rankings (ordered by preference) to the draft administrators.
          </p>
        </div>
      </li>

      <li class="grid grid-cols-[auto_1fr] gap-4">
        <div class="flex flex-col items-center">
          <div
            class="bg-primary-500 text-primary-contrast-dark flex size-9 items-center justify-center rounded-full font-bold"
          >
            2
          </div>
          <div aria-hidden="true" class="bg-surface-700 w-1 flex-1"></div>
        </div>
        <div class="pb-8">
          <h3 class="text-xl font-bold">Regular Draft</h3>
          <p>For each round:</p>
          <ol class="prose-li:my-2">
            <li>
              Draft administrators notify (typically via email) the lab heads about all of the
              students that have chosen their respective research lab as the first choice in their
              rankings.
            </li>
            <li>
              Each lab selects a subset (i.e., possibly none, some, or all) of these first-choice
              students to accept them into the lab. After this point, the selected students are
              considered to be "drafted" and are thus no longer part of the next rounds.
            </li>
            <li>
              The next round of the regular draft begins when all of the labs have submitted their
              preferences. Then, the second-choice preferences of the remaining students are
              evaluated (and so on).
            </li>
          </ol>
        </div>
      </li>

      <li class="grid grid-cols-[auto_1fr] gap-4">
        <div class="flex flex-col items-center">
          <div
            class="bg-primary-500 text-primary-contrast-dark flex size-9 items-center justify-center rounded-full font-bold"
          >
            3
          </div>
          <div aria-hidden="true" class="bg-surface-700 w-1 flex-1"></div>
        </div>
        <div class="pb-8">
          <h3 class="text-xl font-bold">Lottery Round</h3>
          <p>
            The lottery round begins when there are unassigned students remaining by the end of the
            regular draft.
          </p>
          <ol class="prose-li:my-2">
            <li>
              Before the lottery, draft administrators can negotiate with participating labs (with
              available slots) to accept some of the remaining students.
            </li>
            <li>
              After manual intervention, any remaining students are shuffled and assigned to
              participating labs in a round-robin fashion.
            </li>
          </ol>
        </div>
      </li>

      <li class="grid grid-cols-[auto_1fr] gap-4">
        <div class="flex flex-col items-center">
          <div
            class="bg-primary-500 text-primary-contrast-dark flex size-9 items-center justify-center rounded-full font-bold"
          >
            4
          </div>
        </div>
        <div class="pb-8">
          <h3 class="text-xl font-bold">Conclusion</h3>
          <p>The draft concludes when all registered participants have been assigned to a lab.</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="my-8">
    <div class="prose dark:prose-invert my-6 max-w-none">
      <h2 class="border-surface-800 border-b pb-2">Getting Started</h2>
      <p>
        All interactions with the application require UP Mail authentication. The next steps depend
        on your role in the draft.
      </p>
    </div>
    <div class="border-surface-700 overflow-hidden rounded-lg border">
      <div class="border-surface-700 grid grid-cols-3 border-b">
        <button
          class="px-4 py-3 text-center font-medium transition duration-150 {activeTab === 'student'
            ? 'bg-primary-500'
            : 'hover:bg-surface-800'}"
          onclick={() => (activeTab = 'student')}
        >
          <span class="flex items-center justify-center gap-2">
            <Icon src={AcademicCap} class="size-5" />
            <span class="hidden md:block"> For Students </span>
          </span>
        </button>
        <button
          class="border-surface-700 border-l px-4 py-3 text-center font-medium transition duration-150 {activeTab ===
          'lab-head'
            ? 'bg-primary-500'
            : 'hover:bg-surface-800'}"
          onclick={() => (activeTab = 'lab-head')}
        >
          <span class="flex items-center justify-center gap-2">
            <Icon src={Beaker} class="size-5" />
            <span class="hidden md:block"> For Lab Heads </span>
          </span>
        </button>
        <button
          class="border-surface-700 border-l px-4 py-3 text-center font-medium transition duration-150 {activeTab ===
          'admin'
            ? 'bg-primary-500'
            : 'hover:bg-surface-800'}"
          onclick={() => (activeTab = 'admin')}
        >
          <span class="flex items-center justify-center gap-2">
            <Icon src={ShieldExclamation} class="size-5" />
            <span class="hidden md:block"> For Administrators </span>
          </span>
        </button>
      </div>

      <div class="prose dark:prose-invert mx-auto max-w-3xl p-6">
        {#if activeTab === 'student'}
          <h3 class="block md:hidden">For students:</h3>
          <ol>
            <li>
              Go to your <Link href={resolve('/dashboard/profile/')}>profile</Link> and set your student
              number.
              <em>Note that this can only be done once.</em>
            </li>
            <li>
              Set your <Link href={resolve('/dashboard/ranks/')}>lab rankings and preferences</Link
              >.
            </li>
            <li>
              Track the progress of the draft in the <Link href={resolve('/history/')}>history</Link
              > page.
            </li>
            <li>Wait until the draft is finished.</li>
          </ol>
        {:else if activeTab === 'lab-head'}
          <h3 class="block md:hidden">For lab heads:</h3>
          <ol>
            <li>Wait for the administrators to open a draft.</li>
            <li>
              Track the progress of the draft in the <Link href={resolve('/history/')}>history</Link
              > page.
            </li>
            <li>
              Visit the <Link href={resolve('/dashboard/students/')}>students</Link> page to select draftees
              who chose your lab.
            </li>
            <li>Wait until the regular draft process to finish.</li>
            <li>
              During the lottery stage, negotiate with the draft administrators to resolve the
              membership of any remaining draftees.
            </li>
            <li>
              Finally, after the manual interventions, wait for the results of the randomized
              round-robin lottery (if there are any undrafted students).
            </li>
          </ol>
        {:else if activeTab === 'admin'}
          <h3 class="block md:hidden">For administrators:</h3>
          <ol>
            <li>Set the <Link href={resolve('/dashboard/labs/')}>lab quota</Link>.</li>
            <li>Initialize a <Link href={resolve('/dashboard/drafts/')}>new draft</Link>.</li>
            <li>Wait for participating draftees to register their lab preferences.</li>
            <li>
              Officially <Link href={resolve('/dashboard/drafts/')}>start the draft</Link>. This
              will notify all of the concerned lab heads of the interested draftees.
            </li>
            <li>
              Audit the progress of the draft in the <Link href={resolve('/history/')}>history</Link
              > page.
            </li>
            <li>Wait for all rounds of the draft to finish.</li>
            <li>
              After the regular draft process, <Link href={resolve('/dashboard/drafts/')}
                >resolve</Link
              > the membership of the remaining undrafted students by negotiating with the lab heads.
            </li>
            <li>
              <Link href={resolve('/dashboard/drafts/')}>Apply</Link> the necessary manual interventions
              (i.e., assigning students to their labs based on the agreed terms between labs)
            </li>
            <li>
              <Link href={resolve('/dashboard/drafts/')}>Conclude</Link> the draft to proceed to the randomized
              round-robin stage.
            </li>
          </ol>
        {/if}
      </div>
    </div>
  </section>

  <section class="prose dark:prose-invert max-w-none">
    <h2 class="border-surface-800 border-b pb-2">Acknowledgements</h2>
    <p>
      The <Link target="_blank" href="https://github.com/BastiDood/drap">DRAP project</Link>,
      licensed under the free and open-source
      <Link
        target="_blank"
        href="https://github.com/BastiDood/drap/blob/bbd5be8b2b3528d2ba28643a91212c2abaa38ce7/LICENSE"
        >GNU Affero General Public License v3</Link
      >, was originally developed by
      <Link target="_blank" href="https://github.com/BastiDood">Sebastian Luis S. Ortiz</Link>,
      <Link target="_blank" href="https://github.com/VeeIsForVictor">Victor Edwin E. Reyes</Link>,
      and
      <Link target="_blank" href="https://github.com/ehrelevant">Ehren A. Castillo</Link> as a service
      project under the
      <Link target="_blank" href="https://up-csi.org/">UP Center for Student Innovations</Link>. The
      DRAP
      <Link target="_blank" href={asset('/favicon.ico')}>logo</Link>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Vite ?url import is pre-resolved -->
      and <Link target="_blank" href={banner}>banner</Link> were originally designed and created by
      <Link target="_blank" href="https://github.com/Anjellyrika">Angelica Julianne A. Raborar</Link
      >.
    </p>
  </section>
</div>
