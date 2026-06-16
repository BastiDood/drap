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

  let selectedEvent = $state('round-started');
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
        <NativeSelect.Option value="round-started">Round Started</NativeSelect.Option>
        <NativeSelect.Option value="round-submitted">Round Submitted</NativeSelect.Option>
        <NativeSelect.Option value="lottery-intervened">Lottery Intervened</NativeSelect.Option>
        <NativeSelect.Option value="draft-concluded">Draft Concluded</NativeSelect.Option>
        <NativeSelect.Option value="draft-finalization">Draft Finalized</NativeSelect.Option>
        <NativeSelect.Option value="user-assigned">User Assigned</NativeSelect.Option>
      </NativeSelect.Root>
    </div>
    {#if selectedEvent === 'round-started'}
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
    {:else if selectedEvent === 'round-submitted'}
      <div class="space-y-2">
        <Label for="selectionMode">Selection Mode</Label>
        <NativeSelect.Root name="selectionMode" id="selectionMode" class="w-full">
          <NativeSelect.Option value="create">Create Selection</NativeSelect.Option>
          <NativeSelect.Option value="update">Update Selection</NativeSelect.Option>
        </NativeSelect.Root>
      </div>
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
    {:else if selectedEvent === 'lottery-intervened'}
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
    {:else if selectedEvent === 'draft-concluded'}
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
    {:else if selectedEvent === 'draft-finalization'}
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
    {:else if selectedEvent === 'user-assigned'}
      <div class="space-y-2">
        <Label for="draftId">Draft ID</Label>
        <Input type="number" name="draftId" id="draftId" min="1" required placeholder="1" />
      </div>
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
