<script lang="ts" module>
  import Step, { type Status } from '$lib/features/drafts/timeline/step.svelte';
  import type { schema } from '$lib/server/database/drizzle';

  export interface Props {
    candidateCount: number;
    designated?: Pick<schema.User, 'givenName' | 'familyName' | 'email'>;
  }
</script>

<script lang="ts">
  import AtSignIcon from '@lucide/svelte/icons/at-sign';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import KeyRoundIcon from '@lucide/svelte/icons/key-round';
  import TimerIcon from '@lucide/svelte/icons/timer';
  import UsersIcon from '@lucide/svelte/icons/users';

  import Link from '$lib/components/link.svelte';
  import { Badge } from '$lib/components/ui/badge';

  const { candidateCount, designated }: Props = $props();

  const step1Status: Status = $derived(candidateCount > 0 ? 'completed' : 'active');
  const step2Status: Status = $derived.by(() => {
    if (typeof designated !== 'undefined') return 'completed';
    if (candidateCount > 0) return 'active';
    return 'pending';
  });
</script>

<Step title="Volunteer Candidate Senders" status={step1Status} collapsible={false} flush>
  {#snippet metadata()}
    <Badge variant={candidateCount > 0 ? 'secondary' : 'outline'}>
      {candidateCount}
      {candidateCount === 1 ? 'Candidate' : 'Candidates'}
    </Badge>
  {/snippet}
  <p class="text-sm text-muted-foreground">
    A draft administrator can volunteer via the <strong>Volunteer as Candidate Sender</strong> button.
  </p>
  <ul class="mt-3 space-y-2 text-sm">
    <li class="flex items-start gap-2">
      <KeyRoundIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span class="text-muted-foreground"
        >Grants DRAP the permission to send emails via Gmail on your behalf.</span
      >
    </li>
    <li class="flex items-start gap-2">
      <AtSignIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span class="text-muted-foreground"
        >If promoted, your personal Gmail will be used as the sender for all draft notifications.</span
      >
    </li>
    <li class="flex items-start gap-2">
      <UsersIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span class="text-muted-foreground"
        >Consent is personal: only you can volunteer yourself, any admin can <strong>Promote</strong
        >, <strong>Demote</strong>, or <strong>Remove</strong> candidates.</span
      >
    </li>
  </ul>
</Step>
<Step title="Designate a Sender" status={step2Status} collapsible={false} flush last>
  {#snippet metadata()}
    {#if typeof designated === 'undefined'}
      <Badge variant="outline">Pending</Badge>
    {:else}
      <Badge>
        <CheckCircleIcon class="size-3" />
        <Link href="mailto:{designated.email}">{designated.givenName} {designated.familyName}</Link>
      </Badge>
    {/if}
  {/snippet}
  <p class="text-sm text-muted-foreground">
    Any admin can <strong>Promote</strong> a candidate to the <strong>Designated Sender</strong> role.
    The designated sender's Gmail handles all draft notifications.
  </p>
  <ul class="mt-3 space-y-2 text-sm">
    <li class="flex items-start gap-2">
      <TimerIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span class="text-muted-foreground"
        >Gmail rate-limits automated emails over a rolling 24-hour window. Delivery may be delayed
        during high-volume draft events.</span
      >
    </li>
  </ul>
</Step>
