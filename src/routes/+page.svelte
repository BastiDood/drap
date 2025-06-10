<script>
  import {
    AcademicCap,
    Beaker,
    BugAnt,
    DocumentDuplicate,
    LockClosed,
    ShieldExclamation,
  } from '@steeze-ui/heroicons';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { Github } from '@steeze-ui/simple-icons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import banner from '$lib/banner.png?url';
</script>

<div class="prose max-w-none dark:prose-invert">
  <section>
    <h1>DRAP: Draft Ranking Automated Processor</h1>
    <p>
      Welcome to <strong>DRAP</strong>: the <strong>Draft Ranking Automated Processor</strong> for
      the
      <a href="https://up.edu.ph/" target="_blank">University of the Philippines</a>
      <a href="https://upd.edu.ph/" target="_blank">Diliman</a>
      - <a href="https://dcs.upd.edu.ph/">Department of Computer Science</a>'s yearly draft of
      research lab assignments. In a nutshell, this web application automates the mechanics of the
      draft:
    </p>
    <ol>
      <li>
        All participating students register for the draft by providing their full name, email,
        student number, and lab rankings (ordered by preference) to the draft administrators.
      </li>
      <li>
        <span>The <strong>regular draft process</strong> begins. For each round in the draft:</span>
        <ol class="list-[lower-alpha]">
          <li>
            Draft administrators notify (typically via email) the lab heads about all of the
            students that have chosen their respective research lab as the first choice.
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
            labs (that have remaining slots) to check if any of the labs would like to accept some
            of the remaining students immediately.
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
  <section>
    <h2>Getting Started</h2>
    <p>
      All interactions with the application require UP Mail authentication. To <a
        href="/oauth/login/"
        rel="external">sign in with Google</a
      >, simply press the login button at the lower left corner of the dashboard. When logged in,
      the button functions as a logout button instead. The next steps depend on your role in the
      draft.
    </p>
    <Accordion autocollapse>
      <AccordionItem>
        {#snippet lead()}
          <Icon src={AcademicCap} class="h-8" />
        {/snippet}
        {#snippet summary()}
          <strong>For Students</strong>
        {/snippet}
        {#snippet content()}
          <ol>
            <li>
              Go to your <a href="/profile/">profile</a> and set your student number.
              <em>Note that this can only be done once.</em>
            </li>
            <li>Set your <a href="/dashboard/ranks/">lab rankings and preferences</a>.</li>
            <li>Track the progress of the draft in the <a href="/history/">history</a> page.</li>
            <li>Wait until the draft is finished.</li>
          </ol>
        {/snippet}
      </AccordionItem>
      <AccordionItem>
        {#snippet lead()}
          <Icon src={Beaker} class="h-8" />
        {/snippet}
        {#snippet summary()}
          <strong>For Lab Heads</strong>
        {/snippet}
        {#snippet content()}
          <ol>
            <li>Wait for the administrators to open a draft.</li>
            <li>Track the progress of the draft in the <a href="/history/">history</a> page.</li>
            <li>
              Visit the <a href="/dashboard/students/">students</a> page to select draftees who chose
              your lab.
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
      </AccordionItem>
      <AccordionItem>
        {#snippet lead()}
          <Icon src={ShieldExclamation} class="h-8" />
        {/snippet}
        {#snippet summary()}
          <strong>For Administrators</strong>
        {/snippet}
        {#snippet content()}
          <ol>
            <li>Set the <a href="/dashboard/labs/">lab quota</a>.</li>
            <li>Initialize a <a href="/dashboard/drafts/">new draft</a>.</li>
            <li>Wait for participating draftees to register their lab preferences.</li>
            <li>
              Officially <a href="/dashboard/drafts/">start the draft</a>. This will notify all of
              the concerned lab heads of the interested draftees.
            </li>
            <li>Audit the progress of the draft in the <a href="/history/">history</a> page.</li>
            <li>Wait for all rounds of the draft to finish.</li>
            <li>
              After the regular draft process, <a href="/dashboard/drafts/">resolve</a> the membership
              of the remaining undrafted students by negotiating with the lab heads.
            </li>
            <li>
              <a href="/dashboard/drafts/">Apply</a> the necessary manual interventions (i.e., assigning
              students to their labs based on the agreed terms between labs)
            </li>
            <li>
              <a href="/dashboard/drafts/">Conclude</a> the draft to proceed to the randomized round-robin
              stage.
            </li>
          </ol>
        {/snippet}
      </AccordionItem>
    </Accordion>
  </section>
  <section>
    <h2>Acknowledgements</h2>
    <p>
      The <a target="_blank" href="https://github.com/BastiDood/drap">DRAP project</a>, licensed
      under the free and open-source
      <a
        target="_blank"
        href="https://github.com/BastiDood/drap/blob/bbd5be8b2b3528d2ba28643a91212c2abaa38ce7/LICENSE"
        >GNU Affero General Public License v3</a
      >, was originally developed by
      <a target="_blank" href="https://github.com/BastiDood">Sebastian Luis S. Ortiz</a>
      and <a target="_blank" href="https://github.com/VeeIsForVanana">Victor Edwin E. Reyes</a> as a
      service project under the
      <a target="_blank" href="https://up-csi.org/">UP Center for Student Innovations</a>. The DRAP
      <a target="_blank" href="/favicon.ico">logo</a>
      and <a target="_blank" href={banner}>banner</a> were originally designed and created by
      <a target="_blank" href="https://github.com/Anjellyrika">Angelica Julianne A. Raborar</a>.
    </p>
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap"
      class="variant-filled-primary btn btn-lg no-underline"
    >
      <span><Icon src={Github} class="h-8" /></span>
      <span>BastiDood/drap</span>
    </a>
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap/fork"
      class="variant-filled-secondary btn btn-lg no-underline"
    >
      <span><Icon src={DocumentDuplicate} class="h-8" /></span>
      <span>Fork the Repository</span>
    </a>
    <a
      target="_blank"
      href="https://github.com/BastiDood/drap/issues/new"
      class="variant-filled-error btn btn-lg no-underline"
    >
      <span><Icon src={BugAnt} class="h-8" /></span>
      <span>Report a Bug</span>
    </a>
    <a href="/privacy/" class="variant-filled-tertiary btn btn-lg no-underline">
      <span><Icon src={LockClosed} class="h-8" /></span>
      <span>Privacy Policy</span>
    </a>
  </section>
</div>
