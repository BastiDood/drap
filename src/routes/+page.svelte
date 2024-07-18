<script>
    import { Google } from '@steeze-ui/simple-icons';
    import { Icon } from '@steeze-ui/svelte-icon';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);
</script>

<div class="prose max-w-none dark:prose-invert">
    <section>
        <h1>DRAP: Draft Ranking Automated Processor</h1>
        <p>
            Welcome to <strong>DRAP</strong>: the <strong>Draft Ranking Automated Processor</strong> for the
            <a href="https://up.edu.ph/" target="_blank">University of the Philippines</a>
            <a href="https://upd.edu.ph/" target="_blank">Diliman</a>
            - <a href="https://dcs.upd.edu.ph/">Department of Computer Science</a>'s yearly draft of research lab
            assignments. In a nutshell, this web application automates the mechanics of the draft:
        </p>
        <ol>
            <li>
                All participating students register for the draft by providing their full name, email, student number,
                and lab rankings (ordered by preference) to the draft administrators.
            </li>
            <li>
                <span>The <strong>regular draft process</strong> begins. For each round in the draft:</span>
                <ol class="list-[lower-alpha]">
                    <li>
                        Draft administrators notify (typically via email) the lab heads about all of the students that
                        have chosen their respective research lab as the first choice.
                    </li>
                    <li>
                        Each lab selects a subset (i.e., possibly none, some, or all) of these first-choice students to
                        accept them into the lab. After this point, the selected students are considered to be "drafted"
                        and are thus no longer part of the next rounds.
                    </li>
                    <li>
                        The next round begins when all of the labs have submitted their preferences. This time around,
                        the second-choice preferences of the <em>remaining</em> students are evaluated (and so on).
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
                        Before the randomization stage, draft administrators first negotiate with participating labs
                        (that have remaining slots) to check if any of the labs would like to accept some of the
                        remaining students immediately.
                    </li>
                    <li>
                        After manual negotiation and intervention, the remaining students are shuffled and assigned to
                        participating labs in a round-robin fashion.
                    </li>
                </ol>
            </li>
            <li>The draft concludes when all registered participants have been assigned to a lab.</li>
        </ol>
    </section>
</div>
{#if typeof user === 'undefined'}
    <a href="/oauth/login/" rel="external" class="not-prose variant-filled-primary btn">
        <Icon src={Google} class="size-4" />
        <span>Sign in with Google</span>
    </a>
{/if}
