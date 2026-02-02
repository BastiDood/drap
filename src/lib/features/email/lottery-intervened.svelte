<script lang="ts">
  import { Heading, Section, Text } from 'better-svelte-email';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    studentName: string;
    studentEmail: string;
    labName: string;
    draftId: number;
  }

  const {
    studentName,
    studentEmail,
    labName,
    draftId,
  }: Props = $props();
</script>

<EmailLayout preview="Manual assignment notification - Draft #{draftId}">
  <Section>
    <Heading class="text-foreground text-2xl font-bold" as="h1">Manual Assignment Completed</Heading
    >
    <Section class="bg-card text-card-foreground my-6 rounded-lg">
      <Section class="mx-auto max-w-md">
        <Text class="font-semibold">Assignment Details</Text>
        <Text class="mt-2 text-base leading-relaxed">
          <strong>Student:</strong>
          {studentName}<br />
          <strong>Email:</strong>
          {studentEmail}<br />
          <strong>Assigned to:</strong>
          {labName}
        </Text>
      </Section>
    </Section>
    <Text class="text-muted-foreground text-sm">
      This assignment was made through administrative intervention during the lottery phase.
    </Text>
  </Section>
</EmailLayout>
