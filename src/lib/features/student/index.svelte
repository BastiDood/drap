<script lang="ts">
  import type { schema } from '$lib/server/database';

  import HubHeader from './hub-header.svelte';

  import Assigned from './assigned/index.svelte';
  import DraftInProgress from './draft-in-progress/index.svelte';
  import Lottery from './lottery/index.svelte';
  import NoDraft from './no-draft/index.svelte';
  import ProfileSetup from './profile-setup/index.svelte';
  import RegistrationClosed from './registration-closed/index.svelte';
  import RegistrationOpen from './registration-open/index.svelte';
  import SubmissionSummary from './submission-summary.svelte';
  import Submitted from './submitted/index.svelte';

  export interface Lab extends Pick<schema.Lab, 'id' | 'name'> {
    remark: string;
  }

  export interface Submission {
    createdAt: Date;
    labs: Lab[];
  }

  interface Props {
    user: Pick<
      schema.User,
      'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
    >;
    draft?: Pick<schema.Draft, 'id' | 'currRound' | 'maxRounds' | 'registrationClosesAt'>;
    availableLabs?: Pick<schema.Lab, 'id' | 'name'>[];
    submission?: Submission;
    lab?: Pick<schema.Lab, 'name'>;
  }

  let { user, draft, availableLabs, submission, lab }: Props = $props();
</script>

<div class="flex h-full items-center">
  <!-- Profile setup: no student number -->
  {#if user.studentNumber === null}
    <ProfileSetup {user} />
  {:else}
    <!-- Registered user: show header -->
    <div class="size-full space-y-6">
      <HubHeader user={{ ...user, studentNumber: user.studentNumber }} />
      <hr class="border-border" />
      {#if typeof lab !== 'undefined'}
        <Assigned {lab} />
        {#if submission}
          <SubmissionSummary {submission} />
        {/if}
      {:else if typeof draft === 'undefined'}
        <NoDraft />
      {:else if draft.currRound === null}
        <Lottery />
        {#if submission}
          <SubmissionSummary {submission} />
        {/if}
      {:else if draft.currRound === 0}
        {#if submission}
          <Submitted {submission} />
        {:else if availableLabs && new Date() < draft.registrationClosesAt}
          <RegistrationOpen {draft} {availableLabs} />
        {:else}
          <RegistrationClosed registrationClosesAt={draft.registrationClosesAt} />
        {/if}
      {:else if submission}
        <DraftInProgress
          draft={{ currRound: draft.currRound, maxRounds: draft.maxRounds }}
          {submission}
        />
      {:else}
        <RegistrationClosed registrationClosesAt={draft.registrationClosesAt} />
      {/if}
    </div>
  {/if}
</div>
