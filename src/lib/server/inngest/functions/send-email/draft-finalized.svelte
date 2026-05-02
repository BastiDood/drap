<script lang="ts">
  import {
    Button,
    Column,
    Heading,
    Img,
    Row,
    Section,
    Text,
  } from '@better-svelte-email/components';

  import { ORIGIN } from '$lib/env';

  import EmailLayout from './email-layout.svelte';

  interface LotteryAssignment {
    labId: string;
    labName: string;
    studentName: string;
    studentEmail: string;
    avatarUrl: string;
  }

  interface GroupedLotteryAssignment {
    labId: string;
    labName: string;
    students: Pick<LotteryAssignment, 'studentName' | 'studentEmail' | 'avatarUrl'>[];
  }

  interface Props {
    draftId: number;
    lotteryAssignments: LotteryAssignment[];
  }

  const { draftId, lotteryAssignments }: Props = $props();
  const groupedLotteryAssignments = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local grouping container in derived computation
    const grouped = new Map<string, GroupedLotteryAssignment>();
    for (const { labId, labName, studentName, studentEmail, avatarUrl } of lotteryAssignments) {
      const existing = grouped.get(labId);
      if (typeof existing === 'undefined') {
        grouped.set(labId, {
          labId,
          labName,
          students: [{ studentName, studentEmail, avatarUrl }],
        });
        continue;
      }
      existing.students.push({ studentName, studentEmail, avatarUrl });
    }
    return Array.from(grouped.values()).sort((left, right) =>
      left.labId.localeCompare(right.labId),
    );
  });
</script>

<EmailLayout preview="Draft #{draftId} is finalized - View final assignments">
  <Section>
    <Section class="p-4">
      <Heading class="text-2xl font-bold text-foreground" as="h1">Draft Finalized</Heading>
      <Text class="text-base">
        Draft <strong class="text-foreground">#{draftId}</strong> has just been finalized. All registered
        students have been assigned to their respective research labs.
      </Text>
    </Section>
    {#if groupedLotteryAssignments.length > 0}
      <Section class="px-4 pb-4">
        <Section class="mx-auto max-w-md rounded-lg bg-card p-4 text-card-foreground">
          <Heading class="text-lg font-semibold text-foreground" as="h2">
            Finalized Lottery Results
          </Heading>
          {#each groupedLotteryAssignments as group (group.labId)}
            <Section class="my-3 rounded-md border border-muted px-3 py-2">
              <Text class="mb-2 text-sm font-semibold">{group.labName}</Text>
              {#each group.students as student (`${group.labId}:${student.studentEmail}`)}
                <Row class="my-2">
                  <Column class="w-12 align-top">
                    {#if student.avatarUrl.length > 0}
                      <Img
                        src={student.avatarUrl}
                        alt={student.studentName}
                        width="36"
                        height="36"
                        class="block rounded-full object-cover"
                      />
                    {:else}
                      <Section class="m-0 size-9 rounded-full bg-secondary text-center">
                        <Text class="m-0 text-xs font-semibold text-secondary-foreground">
                          {student.studentName.trim()[0]?.toUpperCase() ?? '?'}
                        </Text>
                      </Section>
                    {/if}
                  </Column>
                  <Column class="align-middle">
                    <Text class="my-0 text-sm leading-relaxed font-medium">
                      <a href="mailto:{student.studentEmail}">{student.studentName}</a>
                    </Text>
                    <Text class="my-0 text-xs leading-relaxed text-muted-foreground">
                      {student.studentEmail}
                    </Text>
                  </Column>
                </Row>
              {/each}
            </Section>
          {/each}
        </Section>
      </Section>
    {/if}
    <Section class="px-4 pb-4">
      <Section class="mx-auto max-w-md rounded-lg bg-secondary/30 p-4 text-secondary-foreground">
        <Text class="text-sm">See the new roster of researchers through the lab module.</Text>
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
