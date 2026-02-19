<script lang="ts" module>
  export interface Props {
    onSuccess?: () => void;
  }
</script>

<script lang="ts">
  import SendIcon from '@lucide/svelte/icons/send';
  import { toast } from 'svelte-sonner';

  import * as NativeSelect from '$lib/components/ui/native-select';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  import LotteryAssignmentsInput from './lottery-assignments-input.svelte';

  const { onSuccess }: Props = $props();

  let selectedEvent = $state('draft/round.started');
</script>

<form
  method="post"
  action="/dashboard/?/email"
  class="space-y-4"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success('Email event dispatched successfully.');
          onSuccess?.();
          break;
        case 'failure': {
          const { data, status } = result;
          switch (status) {
            case 404:
              if (typeof data?.message === 'string') {
                toast.error(data.message);
                break;
              }
              toast.error('Referenced lab or user email was not found.');
              break;
            case 422:
              toast.error('Invalid email event payload.');
              break;
            default:
              toast.error('Failed to dispatch email event.');
              break;
          }
          break;
        }
        default:
          break;
      }
    };
  }}
>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="event">Event Type</Label>
      <NativeSelect.Root name="event" id="event" bind:value={selectedEvent} class="w-full">
        <NativeSelect.Option value="draft/round.started">Round Started</NativeSelect.Option>
        <NativeSelect.Option value="draft/round.submitted">Round Submitted</NativeSelect.Option>
        <NativeSelect.Option value="draft/lottery.intervened"
          >Lottery Intervened</NativeSelect.Option
        >
        <NativeSelect.Option value="draft/draft.concluded">Draft Concluded</NativeSelect.Option>
        <NativeSelect.Option value="draft/user.assigned">User Assigned</NativeSelect.Option>
      </NativeSelect.Root>
    </div>
    {#if selectedEvent === 'draft/round.started'}
      <div class="space-y-2">
        <Label for="draftId">Draft ID</Label>
        <Input type="number" name="draftId" id="draftId" min="1" required placeholder="1" />
      </div>
      <div class="space-y-2">
        <Label for="round">Round</Label>
        <Input
          type="number"
          name="round"
          id="round"
          min="1"
          placeholder="Leave blank for lottery round."
        />
      </div>
      <div class="space-y-2">
        <Label for="recipientEmail">Recipient Email</Label>
        <Input
          type="email"
          name="recipientEmail"
          id="recipientEmail"
          required
          placeholder="example@up.edu.ph"
        />
      </div>
    {:else if selectedEvent === 'draft/round.submitted'}
      <div class="space-y-2">
        <Label for="draftId">Draft ID</Label>
        <Input type="number" name="draftId" id="draftId" required placeholder="1" />
      </div>
      <div class="space-y-2">
        <Label for="round">Round</Label>
        <Input type="number" name="round" id="round" min="1" required placeholder="1" />
      </div>
      <div class="space-y-2">
        <Label for="labId">Lab ID</Label>
        <Input type="text" name="labId" id="labId" required placeholder="ndsl" />
      </div>
      <div class="space-y-2">
        <Label for="recipientEmail">Recipient Email</Label>
        <Input
          type="email"
          name="recipientEmail"
          id="recipientEmail"
          required
          placeholder="example@up.edu.ph"
        />
      </div>
    {:else if selectedEvent === 'draft/lottery.intervened'}
      <div class="space-y-2">
        <Label for="draftId">Draft ID</Label>
        <Input type="number" name="draftId" id="draftId" min="1" required placeholder="1" />
      </div>
      <div class="space-y-2">
        <Label for="labId">Lab ID</Label>
        <Input type="text" name="labId" id="labId" required placeholder="ndsl" />
      </div>
      <div class="space-y-2">
        <Label for="studentEmail">Student Email</Label>
        <Input
          type="email"
          name="studentEmail"
          id="studentEmail"
          required
          placeholder="example@up.edu.ph"
        />
      </div>
      <div class="space-y-2">
        <Label for="recipientEmail">Recipient Email</Label>
        <Input
          type="email"
          name="recipientEmail"
          id="recipientEmail"
          required
          placeholder="example@up.edu.ph"
        />
      </div>
    {:else if selectedEvent === 'draft/draft.concluded'}
      <div class="space-y-2">
        <Label for="draftId">Draft ID</Label>
        <Input type="number" name="draftId" id="draftId" min="1" required placeholder="1" />
      </div>
      <div class="space-y-2">
        <Label for="recipientEmail">Recipient Email</Label>
        <Input
          type="email"
          name="recipientEmail"
          id="recipientEmail"
          required
          placeholder="example@up.edu.ph"
        />
      </div>
      <LotteryAssignmentsInput />
    {:else if selectedEvent === 'draft/user.assigned'}
      <div class="space-y-2">
        <Label for="labId">Lab ID</Label>
        <Input type="text" name="labId" id="labId" required placeholder="ndsl" />
      </div>
      <div class="space-y-2">
        <Label for="userEmail">User Email</Label>
        <Input
          type="email"
          name="userEmail"
          id="userEmail"
          required
          placeholder="example@up.edu.ph"
        />
      </div>
    {/if}
  </div>
  <Button type="submit" class="w-full">
    <SendIcon class="size-5" />
    <span>Dispatch Event</span>
  </Button>
</form>
