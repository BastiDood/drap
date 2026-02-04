<script lang="ts">
  import { Button, Heading, Section, Text } from 'better-svelte-email';

  import { ORIGIN } from '$lib/env';
  import EmailLayout from './email-layout.svelte';

  interface Props {
    userName: string;
    labName: string;
  }

  const { userName, labName }: Props = $props();

  const dashboardUrl = `${ORIGIN}/dashboard`;
</script>

<EmailLayout preview="You have been assigned to {labName}">
  <Section>
    <Heading class="text-foreground text-2xl font-bold" as="h1">Lab Assignment</Heading>

    <Text class="text-muted-foreground mt-4 text-base leading-relaxed">
      Hello, <strong class="text-foreground">{userName}</strong>!
    </Text>

    <Text class="text-muted-foreground text-base leading-relaxed">
      We are pleased to inform you that you have been assigned to the <strong
        class="text-foreground">{labName}</strong
      >.
    </Text>
    <Section class="bg-secondary/30 text-secondary-foreground my-6 rounded-lg">
      <Section class="mx-auto max-w-md">
        <Text class="text-sm">
          You can view more details about your lab assignment through your dashboard.
        </Text>
        <Button
          href={dashboardUrl}
          target="_blank"
          pX={24}
          pY={12}
          class="bg-primary text-primary-foreground hover:bg-primary/90 mb-4 rounded-md font-medium"
        >
          Go to Dashboard
        </Button>
      </Section>
    </Section>
  </Section>
</EmailLayout>
