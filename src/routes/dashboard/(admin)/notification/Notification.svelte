<script lang="ts">
  import { assert } from '$lib/assert';
  import { type User } from '$lib/server/database/schema';
  import type { Notification } from '$lib/server/models/notification';
  import { ArrowPathRoundedSquare } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { format } from 'date-fns';

  export type TargetUser = Pick<User, 'email' | 'avatarUrl' | 'givenName' | 'familyName'>;

  interface Props {
    createdAt: Date;
    data: Notification;
    deliveredAt: Date | null;
    user: TargetUser | null;
    id: string;
    failReason: string | null;
  }

  const { data, user, id, deliveredAt, createdAt, failReason }: Props = $props();
  const delivery = $derived(deliveredAt === null ? null : format(deliveredAt, "PPPpp"));
  const creation = $derived(format(createdAt, "PPPpp"));

  function determineTrigger() {
    if (data.target === 'User') {
      assert(user !== null);
      return "Syncing draft results"
    } else {
      switch (data.type) {
        case 'RoundStart':
          return `Start of draft round ${data.round}`;
        case 'RoundSubmit':
          return `Submission by ${data.labId.toLocaleUpperCase()}`;
        case 'LotteryIntervention':
          return "Lottery Round";
        case 'Concluded':
          return "Draft Conclusion";
      }
    }
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
          return `Round ${data.round} Submission by ${data.labId.toLocaleUpperCase()}`;
        case 'LotteryIntervention':
          return `Lottery Intervention of ${user?.email} into ${data.labId.toLocaleUpperCase()}`;
        case 'Concluded':
          return `Conclusion of Draft ${data.draftId}`;
      }
    }
  }

  const trigger = $derived.by(determineTrigger);
  const to = $derived.by(determineRecipient);
  const subject = $derived.by(determineSubject);
</script>

<div class="p-2">
  <div class="flex justify-between">
    <h5 class="h5">
      {#if data.target === 'Draft'}
        Draft
      {:else}
        Student
      {/if}
      Notification
    </h5>
    {#if deliveredAt === null}
    <form method="POST" action="/dashboard/notification/?/redispatch">
      <input type="hidden" name="id" value={id} />
      <button type="submit" class="preset-filled-warning-500 btn">
        <span><Icon src={ArrowPathRoundedSquare} class="h-6" /></span>
        <span>Retry Dispatch</span>
      </button>
    </form>
    {/if}
  </div>
  <small>ID: {id}</small>
  <div class="grid grid-cols-2">
    <div>
      <p><strong>Trigger</strong>: {trigger}</p>
      <p><strong>To</strong>: {to}</p>
      <p><strong>Subject</strong>: {subject}</p>
    </div>
    <div>
      <p><strong>Created At</strong>: <time datetime={createdAt.toLocaleDateString()}>{creation}</time></p>
      {#if deliveredAt === null}
        <p><strong class="text-warning-600">Undelivered notification</strong></p>
        <p class="text-warning-600"><strong>Reason: </strong> {failReason ?? "Unknown - null failReason"}</p>
      {:else}
        <p><strong>Delivered At</strong>: <time datetime={deliveredAt.toLocaleDateString()}>{delivery}</time></p>
      {/if}
    </div>
  </div>
</div>
