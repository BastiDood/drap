<script lang="ts">
  import { assert } from '$lib/assert';
  import { type User } from '$lib/server/database/schema';
  import type { Notification } from '$lib/server/models/notification';

  export type TargetUser = Pick<User, 'email' | 'avatarUrl' | 'givenName' | 'familyName'>;

  interface Props {
    createdAt: Date;
    data: Notification;
    deliveredAt: Date | null;
    user: TargetUser | null;
    id: string;
  }

  const { data, user, id, deliveredAt, createdAt }: Props = $props();

  function determineTrigger() {

  }

  function determineRecipient() {
    if (data.target === 'User') {
      assert(user !== null);
      return `${user.familyName.toLocaleUpperCase()}, ${user.givenName} <${user.email}>`;
    } else {
      switch (data.type) {
        case 'RoundSubmit':
          return "All Draft Administrators";
        default:
          return "All Draft Administrators and Lab Heads";
      }
    }
  }

  function determineSubject() {
    if (data.target === 'User') {
      assert(user !== null);
      return `Assignment of ${user.familyName} to ${data.labId.toLocaleUpperCase()}`
    } else {
      switch (data.type) {
        case 'RoundStart':
          return `Round ${data.round} Start`;
        case 'RoundSubmit':
          return `Round ${data.round} Submission by ${data.labId}`;
        case 'LotteryIntervention':
          return `Lottery Intervention of ${user?.email} into ${data.labId}`;
        case 'Concluded':
          return `Conclusion of Draft ${data.draftId}`;
      }
    }
  }

  const trigger = $derived.by(determineTrigger);
  const to = $derived.by(determineRecipient);
  const subject = $derived.by(determineSubject);
</script>

<div>
  <h5 class="h5">
    {#if data.target === 'Draft'}
      Draft
    {:else}
      Student
    {/if}
    Notification
  </h5>
  <small>ID: {id}</small>
  <div class="grid grid-cols-2">
    <div>
      <p><strong>Trigger</strong>: {trigger}</p>
      <p><strong>To</strong>: {to}</p>
      <p><strong>Subject</strong>: {subject}</p>
    </div>
    <div>
      <p><strong>Created At</strong>: {createdAt}</p>
      {#if deliveredAt === null}
        <p><strong class="text-warning-600">Undelivered notification</strong></p>
      {:else}
        <p><strong>Delivered At</strong>: {deliveredAt}</p>
      {/if}
    </div>
  </div>
</div>
