<script lang="ts">
  import { Button, Heading, Section, Text } from '@better-svelte-email/components';

  import { ORIGIN } from '$lib/env';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    draftId: number;
    draftYear: number;
  }

  const { draftId, draftYear }: Props = $props();
</script>

<EmailLayout preview="Draft {draftYear} has been finalized.">
  <Section>
    <Section class="p-4">
      <Heading class="text-2xl font-bold text-foreground" as="h1">Draft Finalized</Heading>
      <Text class="text-base">
        <strong class="text-foreground">Draft {draftYear}</strong> has been finalized. Draftees have been
        notified via email of their respective assignments.
      </Text>
    </Section>
    <Section class="px-4 pb-4">
      <Section class="mx-auto max-w-md rounded-lg bg-secondary/30 p-4 text-secondary-foreground">
        <Text class="text-sm">Review the finalized draft in DRAP.</Text>
        <Button
          href="{ORIGIN}/dashboard/drafts/{draftId}/"
          target="_blank"
          pX={24}
          pY={12}
          class="mb-4 rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90"
        >
          View Draft
        </Button>
      </Section>
    </Section>
  </Section>
</EmailLayout>
