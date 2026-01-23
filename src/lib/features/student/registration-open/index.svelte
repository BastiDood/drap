<script lang="ts">
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import type { schema } from '$lib/server/database';

  import LabPreferenceForm from './lab-preference-form.svelte';

  interface Props {
    draft: Pick<schema.Draft, 'id' | 'maxRounds' | 'registrationClosesAt'>;
    availableLabs: Pick<schema.Lab, 'id' | 'name'>[];
  }

  let { draft, availableLabs = $bindable() }: Props = $props();

  const closeDate = $derived(format(draft.registrationClosesAt, 'PPP'));
  const closeTime = $derived(format(draft.registrationClosesAt, 'pp'));
</script>

<div class="space-y-6">
  <Alert.Root>
    <ClockIcon class="size-4" />
    <Alert.Title>Registration Open</Alert.Title>
    <Alert.Description>
      Registration closes on <strong>{closeDate}</strong> at <strong>{closeTime}</strong>. Submit
      your lab preferences before the deadline.
    </Alert.Description>
  </Alert.Root>
  <LabPreferenceForm draftId={draft.id} maxRounds={draft.maxRounds} bind:availableLabs />
</div>
