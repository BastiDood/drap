<script module>
  const DURATION = { duration: 250 };
</script>

<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import BoxSelectIcon from '@lucide/svelte/icons/box-select';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import XIcon from '@lucide/svelte/icons/x';
  import { crossfade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card';
  import * as Empty from '$lib/components/ui/empty';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database/drizzle';
  import { TextArea } from '$lib/components/ui/textarea';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  interface Props {
    draftId: bigint;
    maxRounds: number;
    availableLabs: Pick<schema.Lab, 'id' | 'name'>[];
  }

  let { draftId, maxRounds, availableLabs = $bindable() }: Props = $props();

  let selectedLabs = $state<typeof availableLabs>([]);

  const remaining = $derived(maxRounds - selectedLabs.length);
  const hasRemaining = $derived(remaining > 0);

  function selectLab(index: number) {
    if (selectedLabs.length >= maxRounds) return;
    selectedLabs.push(...availableLabs.splice(index, 1));
    selectedLabs = selectedLabs;
    availableLabs = availableLabs;
  }

  function moveLabUp(above: number) {
    // eslint-disable-next-line no-param-reassign
    const below = above--;
    if (above < 0) return;

    const temp = selectedLabs[below];
    assert(typeof temp !== 'undefined');
    const target = selectedLabs[above];
    assert(typeof target !== 'undefined');

    selectedLabs[below] = target;
    selectedLabs[above] = temp;
  }

  function moveLabDown(below: number) {
    // eslint-disable-next-line no-param-reassign
    const above = below++;
    if (below >= selectedLabs.length) return;

    const temp = selectedLabs[below];
    assert(typeof temp !== 'undefined');
    const target = selectedLabs[above];
    assert(typeof target !== 'undefined');

    selectedLabs[below] = target;
    selectedLabs[above] = temp;
  }

  function resetSelection(index: number) {
    availableLabs.push(...selectedLabs.splice(index, 1));
  }

  const [send, receive] = crossfade(DURATION);
</script>

<form
  method="post"
  action="/dashboard/student/?/submit"
  class="space-y-4"
  use:enhance={({ submitter, cancel }) => {
    const message =
      selectedLabs.length === 0
        ? 'Are you sure you want to skip lab preferences? You will go directly to the lottery.'
        : `Are you sure you want to select ${selectedLabs.length} labs?`;

    // eslint-disable-next-line no-alert
    if (!confirm(message)) {
      cancel();
      return;
    }

    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;

    return async ({ update, result }) => {
      submitter.disabled = false;
      await update({ reset: false });
      switch (result.type) {
        case 'success':
          toast.success('Uploaded your lab preferences.');
          break;
        case 'failure':
          switch (result.status) {
            case 403:
              toast.error('You have already set your lab preferences before.');
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draftId} />
  <h1 class="text-3xl font-semibold">Select Lab Preference</h1>
  <p>
    Select your preferred labs from the list of available labs and rank them by order of preference.
  </p>
  <div class="mt-8 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
    <Card.Root variant="soft" class="flex h-full">
      <Card.Header>
        <Card.Title class="text-2xl">Available Labs</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if availableLabs.length > 0}
          <ul inert={selectedLabs.length >= maxRounds} class="space-y-2 inert:opacity-20">
            {#each availableLabs as { id, name }, idx (id)}
              <li>
                <button
                  type="button"
                  class="bg-muted hover:bg-muted/80 w-full flex-auto rounded-md p-4 text-left transition duration-150"
                  onclick={selectLab.bind(null, idx)}
                >
                  {name}
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <Empty.Root>
            <Empty.Media variant="icon">
              <InboxIcon />
            </Empty.Media>
            <Empty.Header>
              <Empty.Title>No more labs available</Empty.Title>
              <Empty.Description>There are no more labs remaining in the list.</Empty.Description>
            </Empty.Header>
          </Empty.Root>
        {/if}
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft" class="flex h-full">
      <Card.Header>
        <Card.Title class="text-2xl">Ranking</Card.Title>
        <span>
          {#if hasRemaining}
            You may select up to <span class="font-bold">{remaining}</span>
            {#if remaining === 1}lab{:else}labs{/if} left.
          {:else}
            You may no longer select any more labs.
          {/if}
        </span>
      </Card.Header>
      <Card.Content>
        {#if selectedLabs.length > 0}
          <ol class="space-y-2">
            {#each selectedLabs as { id, name }, idx (id)}
              {@const config = { key: id }}
              <li
                class="border-border dark:bg-muted bg-muted/20 flex flex-col gap-4 rounded-lg border p-4 transition-shadow hover:shadow-md"
                in:receive={config}
                out:send={config}
                animate:flip={DURATION}
              >
                <input type="hidden" name="labs" value={id} />
                <div class="flex items-center gap-3">
                  <div
                    class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-full pb-0.5 text-lg font-semibold"
                  >
                    {idx + 1}
                  </div>
                  <div class="grow">{name}</div>
                  <div class="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            type="button"
                            size="icon"
                            class="bg-success text-success-foreground hover:bg-success/80"
                            onclick={moveLabUp.bind(null, idx)}
                            disabled={idx <= 0}
                          >
                            <ArrowUpIcon class="size-5" />
                          </Button>
                        {/snippet}
                      </TooltipTrigger>
                      <TooltipContent>Move up</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            type="button"
                            size="icon"
                            class="bg-warning text-warning-foreground hover:bg-warning/80"
                            onclick={moveLabDown.bind(null, idx)}
                            disabled={idx >= selectedLabs.length - 1}
                          >
                            <ArrowDownIcon class="size-5" />
                          </Button>
                        {/snippet}
                      </TooltipTrigger>
                      <TooltipContent>Move down</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            type="button"
                            size="icon"
                            variant="destructive"
                            onclick={resetSelection.bind(null, idx)}
                          >
                            <XIcon class="size-5" />
                          </Button>
                        {/snippet}
                      </TooltipTrigger>
                      <TooltipContent>Remove selection</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <TextArea
                  name="remarks"
                  placeholder={`Hello ${id.toUpperCase()}, my name is... I would like to do more research on...`}
                  maxlength={1028}
                />
              </li>
            {/each}
          </ol>
        {:else}
          <Empty.Root>
            <Empty.Media variant="icon">
              <BoxSelectIcon />
            </Empty.Media>
            <Empty.Header>
              <Empty.Title>No labs selected</Empty.Title>
              <Empty.Description>
                Click on a lab from the available list to add it to your ranking.
              </Empty.Description>
            </Empty.Header>
          </Empty.Root>
        {/if}
      </Card.Content>
      <Card.Footer class="self-end">
        <Button type="submit">Submit Lab Preferences</Button>
      </Card.Footer>
    </Card.Root>
  </div>
</form>
