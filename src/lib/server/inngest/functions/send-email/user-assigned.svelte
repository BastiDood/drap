<script lang="ts">
  import { Button, Heading, Section, Text } from 'better-svelte-email';

  import { ORIGIN } from '$lib/env';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    userName: string;
    labName: string;
  }

  const { userName, labName }: Props = $props();
</script>

<EmailLayout preview="You have been assigned to {labName}">
  <Section>
    <Heading class="text-2xl font-bold text-foreground" as="h1">Lab Assignment</Heading>
    <Text class="mt-4 text-base leading-relaxed text-muted-foreground">
      Hello, <strong class="text-foreground">{userName}</strong>!
    </Text>
    <Text class="text-base leading-relaxed text-muted-foreground">
      We are pleased to inform you that you have been assigned to the <strong
        class="text-foreground">{labName}</strong
      >.
    </Text>
    <Section class="my-6 rounded-lg bg-secondary/30 text-secondary-foreground">
      <Section class="mx-auto max-w-md">
        <Text class="text-sm">
          You can view more details about your lab assignment through your dashboard.
        </Text>
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
