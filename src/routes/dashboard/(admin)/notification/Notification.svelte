<script lang="ts">
  import { assert } from '$lib/assert';
  import { type User } from '$lib/server/database/schema';
  import type { Notification } from '$lib/server/models/notification';

  export type TargetUser = Pick<User, 'email' | 'avatarUrl' | 'givenName' | 'familyName'>;

  interface Props {
    data: Notification;
    user: TargetUser | null;
    id: string;
  }

  const { data, user, id }: Props = $props();

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
      return `Assignment of ${user.familyName}`
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
  <div class="flex flex-col">
    <p><strong>Trigger</strong>: {trigger}</p>
    <p><strong>To</strong>: {to}</p>
    <p><strong>Subject</strong>: {subject}</p>
  </div>
</div>
