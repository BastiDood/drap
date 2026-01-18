<script>
  import {
    AcademicCap,
    ArrowRight,
    Beaker,
    BugAnt,
    DocumentDuplicate,
    LockClosed,
    ShieldExclamation,
  } from '@steeze-ui/heroicons';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { Github } from '@steeze-ui/simple-icons';
  import { Icon } from '@steeze-ui/svelte-icon';

  import banner from '$lib/banner.png?url';
  import { asset, resolve } from '$app/paths';
</script>

<section class="prose dark:prose-invert max-w-none">
  <h1>DRAP: Draft Ranking Automated Processor</h1>
  <p>
    Welcome to <strong>DRAP</strong>: the <strong>Draft Ranking Automated Processor</strong> for the
    <a href="https://up.edu.ph/" target="_blank">University of the Philippines</a>
    <a href="https://upd.edu.ph/" target="_blank">Diliman</a>
    - <a href="https://dcs.upd.edu.ph/" target="_blank">Department of Computer Science</a>'s yearly
    draft of research lab assignments. In a nutshell, this web application automates the mechanics
    of the draft:
  </p>
  <div class="not-prose my-6">
    <a href={resolve('/dashboard/')} class="preset-filled-primary-500 btn btn-xl no-underline">
      <Icon src={ArrowRight} size="24" />
      <span>Go to Dashboard</span>
    </a>
  </div>
  <ol>
    <li>
      All participating students register for the draft by providing their full name, email, student
      number, and lab rankings (ordered by preference) to the draft administrators.
    </li>
    <li>
      <span>The <strong>regular draft process</strong> begins. For each round in the draft:</span>
      <ol class="list-[lower-alpha]">
        <li>
          Draft administrators notify (typically via email) the lab heads about all of the students
          that have chosen their respective research lab as the first choice.
        </li>
        <li>
          Each lab selects a subset (i.e., possibly none, some, or all) of these first-choice
          students to accept them into the lab. After this point, the selected students are
          considered to be "drafted" and are thus no longer part of the next rounds.
        </li>
        <li>
          The next round begins when all of the labs have submitted their preferences. This time
          around, the second-choice preferences of the <em>remaining</em> students are evaluated (and
          so on).
        </li>
      </ol>
    </li>
    <li>
      <span>
        Should there be students remaining by the end of the regular draft process, the
        <strong>lottery round</strong> begins.
      </span>
      <ol class="list-[lower-alpha]">
        <li>
          Before the randomization stage, draft administrators first negotiate with participating
          labs (that have remaining slots) to check if any of the labs would like to accept some of
          the remaining students immediately.
        </li>
        <li>
          After manual negotiation and intervention, the remaining students are shuffled and
          assigned to participating labs in a round-robin fashion.
        </li>
      </ol>
    </li>
    <li>The draft concludes when all registered participants have been assigned to a lab.</li>
  </ol>
</section>
<section class="prose dark:prose-invert max-w-none">
  <h2>Getting Started</h2>
  <p>
    All interactions with the application require UP Mail authentication. To <a
      href="/dashboard/oauth/login"
      rel="external">sign in with Google</a
    >, simply press the login button at the lower left corner of the dashboard. When logged in, the
    button functions as a logout button instead. The next steps depend on your role in the draft.
  </p>
</section>
<Accordion collapsible>
  <Accordion.Item
    value="student"
    controlClasses="prose dark:prose-invert max-w-none"
    panelClasses="prose dark:prose-invert max-w-none"
  >
    {#snippet lead()}
      <Icon src={AcademicCap} class="h-8" />
    {/snippet}
    {#snippet control()}
      <strong>For Students</strong>
    {/snippet}
    {#snippet panel()}
      <ol>
        <li>
          Go to your <a href={resolve('/dashboard/profile/')}>profile</a> and set your student
          number.
          <em>Note that this can only be done once.</em>
        </li>
        <li>Set your <a href={resolve('/dashboard/ranks/')}>lab rankings and preferences</a>.</li>
        <li>
          Track the progress of the draft in the <a href={resolve('/history/')}>history</a> page.
        </li>
        <li>Wait until the draft is finished.</li>
      </ol>
    {/snippet}
  </Accordion.Item>
  <Accordion.Item
    value="lab-head"
    controlClasses="prose dark:prose-invert max-w-none"
    panelClasses="prose dark:prose-invert max-w-none"
  >
    {#snippet lead()}
      <Icon src={Beaker} class="h-8" />
    {/snippet}
    {#snippet control()}
      <strong>For Lab Heads</strong>
    {/snippet}
    {#snippet panel()}
      <ol>
        <li>Wait for the administrators to open a draft.</li>
        <li>
          Track the progress of the draft in the <a href={resolve('/history/')}>history</a> page.
        </li>
        <li>
          Visit the <a href={resolve('/dashboard/students/')}>students</a> page to select draftees who
          chose your lab.
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
    {/snippet}
  </Accordion.Item>
  <Accordion.Item
    value="administrator"
    controlClasses="prose dark:prose-invert max-w-none"
    panelClasses="prose dark:prose-invert max-w-none"
  >
    {#snippet lead()}
      <Icon src={ShieldExclamation} class="h-8" />
    {/snippet}
    {#snippet control()}
      <strong>For Administrators</strong>
    {/snippet}
    {#snippet panel()}
      <ol>
        <li>Set the <a href={resolve('/dashboard/labs/')}>lab quota</a>.</li>
        <li>Initialize a <a href={resolve('/dashboard/drafts/')}>new draft</a>.</li>
        <li>Wait for participating draftees to register their lab preferences.</li>
        <li>
          Officially <a href={resolve('/dashboard/drafts/')}>start the draft</a>. This will notify
          all of the concerned lab heads of the interested draftees.
        </li>
        <li>
          Audit the progress of the draft in the <a href={resolve('/history/')}>history</a> page.
        </li>
        <li>Wait for all rounds of the draft to finish.</li>
        <li>
          After the regular draft process, <a href={resolve('/dashboard/drafts/')}>resolve</a> the membership
          of the remaining undrafted students by negotiating with the lab heads.
        </li>
        <li>
          <a href={resolve('/dashboard/drafts/')}>Apply</a> the necessary manual interventions (i.e.,
          assigning students to their labs based on the agreed terms between labs)
        </li>
        <li>
          <a href={resolve('/dashboard/drafts/')}>Conclude</a> the draft to proceed to the randomized
          round-robin stage.
        </li>
      </ol>
    {/snippet}
  </Accordion.Item>
</Accordion>
<section class="prose dark:prose-invert max-w-none">
  <h2>Acknowledgements</h2>
  <p>
    The <a target="_blank" href="https://github.com/BastiDood/drap">DRAP project</a>, licensed under
    the free and open-source
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap/blob/bbd5be8b2b3528d2ba28643a91212c2abaa38ce7/LICENSE"
      >GNU Affero General Public License v3</a
    >, was originally developed by
    <a target="_blank" href="https://github.com/BastiDood">Sebastian Luis S. Ortiz</a>,
    <a target="_blank" href="https://github.com/VeeIsForVictor">Victor Edwin E. Reyes</a>, and
    <a target="_blank" href="https://github.com/ehrelevant">Ehren A. Castillo</a> as a service
    project under the
    <a target="_blank" href="https://up-csi.org/">UP Center for Student Innovations</a>. The DRAP
    <a target="_blank" href={asset('/favicon.ico')}>logo</a>
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Vite ?url import is pre-resolved -->
    and <a target="_blank" href={banner}>banner</a> were originally designed and created by
    <a target="_blank" href="https://github.com/Anjellyrika">Angelica Julianne A. Raborar</a>.
  </p>
  <div class="not-prose flex flex-wrap gap-1">
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap"
      class="preset-filled-primary-500 btn btn-lg no-underline"
    >
      <Icon src={Github} size="24" />
      <span>BastiDood/drap</span>
    </a>
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap/fork"
      class="preset-filled-secondary-500 btn btn-lg no-underline"
    >
      <Icon src={DocumentDuplicate} size="24" />
      <span>Fork the Repository</span>
    </a>
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap/issues/new"
      class="preset-filled-error-500 btn btn-lg no-underline"
    >
      <Icon src={BugAnt} size="24" />
      <span>Report a Bug</span>
    </a>
    <a href={resolve('/privacy/')} class="preset-filled-tertiary-500 btn btn-lg no-underline">
      <Icon src={LockClosed} size="24" />
      <span>Privacy Policy</span>
    </a>
  </div>
</section>
