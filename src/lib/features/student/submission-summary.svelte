<script lang="ts">
  import { format } from 'date-fns';

  import * as Card from '$lib/components/ui/card';
  import type { schema } from '$lib/server/database';

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

<Card.Root class="border-secondary bg-secondary/10">
  <Card.Content class="prose dark:prose-invert max-w-none pt-6">
    <p>
      You submitted your lab preferences on <strong>{creationDate}</strong> at
      <strong>{creationTime}</strong>.
    </p>
    {#if submission.labs.length > 0}
      <ol>
        {#each submission.labs as { name, remark } (name)}
          <li>
            {name}
            {#if remark.length > 0}
              <p class="text-sm">
                <strong>Remarks:</strong>
                {remark}
              </p>
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <p>You selected none of the labs. You will thus skip ahead to the lottery phase.</p>
    {/if}
  </Card.Content>
</Card.Root>
