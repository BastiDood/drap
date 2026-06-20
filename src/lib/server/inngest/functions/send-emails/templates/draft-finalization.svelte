<script lang="ts">
  import { Button, Heading, Section, Text } from '@better-svelte-email/components';

  import { ORIGIN } from '$lib/env';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    draftYear: number;
  }

  const { draftYear }: Props = $props();
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
        <!--
        TODO: Discriminate between lab head and draft admin recipients so draft admins
        can link directly to the finalized draft instead of the dashboard.
        -->
        <Text class="text-sm">View the finalized draft updates in DRAP.</Text>
        <Button
          href="{ORIGIN}/dashboard/"
          target="_blank"
          pX={24}
          pY={12}
          class="mb-4 rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </Button>
      </Section>
    </Section>
  </Section>
</EmailLayout>
