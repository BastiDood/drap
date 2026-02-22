<script lang="ts">
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Calendar from '@lucide/svelte/icons/calendar';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import Clock from '@lucide/svelte/icons/clock';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import { format } from 'date-fns';

  import * as Card from '$lib/components/ui/card';
  import type { schema } from '$lib/server/database/drizzle';

  export interface Lab extends Pick<schema.Lab, 'name'> {
    remark: string;
  }

  export interface Submission {
    createdAt: Date;
    labs: Lab[];
  }

  interface Props {
    submission: Submission;
  }

  const { submission }: Props = $props();

  const creationDate = $derived(format(submission.createdAt, 'PPP'));
  const creationTime = $derived(format(submission.createdAt, 'pp'));
</script>

<Card.Root>
  <Card.Header>
    <div class="flex items-center gap-2">
      <ClipboardList class="size-5" />
      <Card.Title class="text-lg">Your Lab Preferences</Card.Title>
    </div>
    <Card.Description>
      <div>
        <span class="inline-flex items-center gap-1"
          ><CheckCircleIcon class="size-4 opacity-50" />Submitted on</span
        >
        <span class="inline-flex items-center gap-1"><Calendar class="size-4" />{creationDate}</span
        >
        <span class="inline-flex items-center gap-1"><Clock class="size-4" />{creationTime}</span>
      </div>
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if submission.labs.length > 0}
      <ol class="space-y-3">
        {#each submission.labs as { name, remark }, i (name)}
          <li class="dark:bg-background/50 bg-muted/30 flex flex-col space-y-1 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div
                class="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-full pb-0.5 text-sm font-bold"
              >
                {i + 1}
              </div>
              <span class="font-semibold">{name}</span>
            </div>
            {#if remark.length > 0}
              <div class="text-muted-foreground flex items-center gap-2 p-2 text-sm">
                <div class="flex gap-3">
                  <MessageSquare class="mt-0.75 size-4 shrink-0" />
                  <p class="italic">
                    {remark}
                  </p>
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <div class="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <AlertCircle class="text-muted-foreground size-10" />
        <h3 class="text-xl font-semibold">No Labs Selected</h3>
        <p class="text-muted-foreground max-w-xs text-sm">
          You selected none of the labs. You will thus skip ahead to the lottery phase.
        </p>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
