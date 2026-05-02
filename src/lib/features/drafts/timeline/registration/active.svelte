<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert';
  import * as Popover from '$lib/components/ui/popover';
  import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  interface Props {
    draftId: string;
    studentCount: number;
    snapshots: DraftLabQuotaSnapshot[];
  }

  const { draftId, studentCount, snapshots }: Props = $props();
</script>

<div class="space-y-4">
  {#if studentCount > 0}
    <div>
      <div class="space-y-4">
        <section class="prose dark:prose-invert">
          <h3 class="flex items-center gap-1.5">
            Registered Students
            <Popover.Root>
              <Popover.Trigger class="leading-none transition hover:opacity-80">
                <CircleHelpIcon class="size-3.5 text-muted-foreground" />
              </Popover.Trigger>
              <Popover.Content class="max-w-sm space-y-2 text-sm font-normal">
                <p>
                  There are currently <strong>{studentCount}</strong> students who have registered
                  for this draft. Press the <strong>"Start Draft"</strong> button to close registration
                  and start the draft automation.
                </p>
                <p>
                  Lab heads will be notified when the first round begins. The draft proceeds to the
                  next round when all lab heads have submitted their preferences. This process
                  repeats until the configured maximum number of rounds has elapsed, after which the
                  draft pauses until an administrator <em>manually</em> proceeds with the lottery stage.
                </p>
              </Popover.Content>
            </Popover.Root>
          </h3>
          <p>
            There are currently <strong>{studentCount}</strong> students who have registered for this
            draft.
          </p>
        </section>
        <QuotaCard {draftId} mode="initial" {snapshots} />
        <div class="flex items-center justify-center">
          <RegisteredDraftees {draftId} variant="accent">
            No students have registered yet.
          </RegisteredDraftees>
        </div>
      </div>
    </div>
  {:else}
    <Alert.Root variant="warning">
      <TriangleAlertIcon />
      <Alert.Description>
        No students have registered for this draft yet. The draft cannot proceed until at least one
        student participates.
      </Alert.Description>
    </Alert.Root>
  {/if}
</div>
