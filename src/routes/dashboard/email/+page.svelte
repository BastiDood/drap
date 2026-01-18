<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ShieldExclamation } from '@steeze-ui/heroicons';

  import ErrorAlert from '$lib/alerts/Error.svelte';
  import WarningAlert from '$lib/alerts/Warning.svelte';

  import DesignateForm from './DesignateForm.svelte';

  const { data } = $props();
  const {
    senders,
    user: { email },
  } = $derived(data);
  const disabled = $derived(
    typeof senders.find(({ email: other }) => other === email) !== 'undefined',
  );
</script>

<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[auto_1fr]">
  <div class="prose dark:prose-invert max-w-none lg:max-w-prose">
    <h2>Email Notifications</h2>
    <p>
      To enable email notifications, one of the draft administrators must first volunteer themselves
      to be the
      <strong>Designated Sender</strong> of the system. All emails will be sent on behalf of the
      <dfn>designated sender</dfn>. There are <em>no</em> special Gmail accounts; the personal email
      account of the designated sender will be used for all email notifications
      <em>as if they had sent the notification themselves</em>.
    </p>
    <p>
      Given the security implications and risks of impersonation, the sensitive privilege to send
      emails on behalf of administrators <em>requires</em> elevated consent. Thus, before becoming a
      designated sender, an administrator must first volunteer themselves to be a
      <strong>Candidate Sender</strong> via the button below (which will be disabled if the administrator
      has already volunteered previously). Pressing the button redirects the user to the Google consent
      screen.
    </p>
    <form method="get" action="/dashboard/oauth/login">
      <input type="hidden" name="extended" value="1" />
      <button type="submit" {disabled} class="not-prose preset-filled-primary-500 btn w-full">
        <span><Icon src={ShieldExclamation} class="h-8" /></span>
        <span>Volunteer as a Candidate Sender</span>
      </button>
    </form>
    <p>
      Consenting candidate senders are listed on this page. Using the <strong>"Promote"</strong>
      buton, each candidate sender may then be promoted as the designated sender of the system. Analogously,
      the
      <strong>"Demote"</strong> button demotes a designated sender back to candidate sender status.
      Lastly, an administrator may press the <strong>"Remove"</strong> to revoke their consent.
    </p>
    <div class="not-prose space-y-4">
      <WarningAlert
        >Note that consent is user-specific. Nevertheless, <em>any</em> draft administrator may
        promote, demote, and remove <em>any</em> of the candidate senders.</WarningAlert
      >
      <WarningAlert
        >Google sets <a
          target="_blank"
          href="https://support.google.com/a/answer/166852#limits"
          class="anchor">limits</a
        > on the number of automated emails that can be sent within a rolling 24-hour period. As such,
        some email notifications may not timely arrive.</WarningAlert
      >
    </div>
  </div>
  {#if senders.length > 0}
    <DesignateForm {senders} />
  {:else}
    <ErrorAlert>There are no candidate senders yet.</ErrorAlert>
  {/if}
</div>
