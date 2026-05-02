<script lang="ts">
  import { Button, Heading, Section, Text } from '@better-svelte-email/components';

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
    <Section class="p-4">
      <Heading class="text-2xl font-bold text-foreground" as="h1">Lab Assignment</Heading>
      <Text class="mt-4 text-base leading-relaxed text-muted-foreground">
        Hello, <strong class="text-foreground">{userName}</strong>!
      </Text>
      <Text class="text-base leading-relaxed text-muted-foreground">
        We are pleased to inform you that you have been assigned to the <strong
          class="text-foreground">{labName}</strong
        >.
      </Text>
    </Section>
    <Section class="px-4 pb-4">
      <Section class="mx-auto max-w-md rounded-lg bg-secondary/30 p-4 text-secondary-foreground">
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
