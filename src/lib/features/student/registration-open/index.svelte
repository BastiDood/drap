<script lang="ts">
  import { format } from 'date-fns';

  import Callout from '$lib/components/callout.svelte';
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

<div class="space-y-6 pb-12">
  <Callout variant="info" title="Registration Open">
    <p>
      Registration closes on <strong>{closeDate}</strong> at <strong>{closeTime}</strong>. Submit
      your lab preferences before the deadline.
    </p>
  </Callout>
  <LabPreferenceForm draftId={draft.id} maxRounds={draft.maxRounds} bind:availableLabs />
</div>
